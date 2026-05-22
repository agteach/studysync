import User from "../models/User.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import sendEmail from "../utils/sendEmail.js"

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    })
}

const normalizeEmail = (email = "") => email.trim().toLowerCase()
const shouldRequireEmailVerification = () =>
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" ||
    process.env.NODE_ENV === "production"
const isValidEmail = (email = "") =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const normalizedName = name?.trim()
        const normalizedEmail = normalizeEmail(email)
        const requireEmailVerification =
            shouldRequireEmailVerification()

        // check empty fields
        if (!normalizedName || !normalizedEmail || !password) {
            return res.status(400).json({
                message: "All fields are required",
            })
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters long",
            })
        }

        // check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail,
        })

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            })
        }
        // generate verification token
        const verificationToken = requireEmailVerification
            ? crypto.randomBytes(32).toString("hex")
            : undefined



        // create user
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            verificationToken,
            isVerified: !requireEmailVerification,

        })
        if (requireEmailVerification) {
            // send verification email
            const verificationLink =
                `${process.env.CLIENT_URL}/verify-email/${verificationToken}`

            try {
                await sendEmail(
                    user.email,
                    "Verify Your StudySync Account", `
           <h2>Welcome to StudySync</h2>
           <p>Please verify your email:</p>
             <a href="${verificationLink}">
            Verify Account
            </a> `
                )
            } catch (error) {
                await User.findByIdAndDelete(user._id)

                return res.status(500).json({
                    message:
                        "Unable to send verification email. Please try registering again.",
                })
            }
        }

        // response
        res.status(201).json({
            email: user.email,
            message:
                requireEmailVerification
                    ? "Registration successful. Please verify your email before logging in."
                    : "Registration successful. You can log in now.",
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const normalizedEmail = normalizeEmail(email)

        // check fields
        if (!normalizedEmail || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            })
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            })
        }

        // find user
        const user = await User.findOne({
            email: normalizedEmail,
        })

        // check user and password
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                message: "Invalid credentials",
            })
        }
        if (
            shouldRequireEmailVerification() &&
            !user.isVerified
        ) {
            return res.status(401).json({
                message: "Please verify your email",
            })
        }

        // success response
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
            })
        }

        user.isVerified = true
        user.verificationToken = undefined

        await user.save()

        res.status(200).json({
            message: "Email verified successfully",
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const normalizedEmail = normalizeEmail(email)

        if (!normalizedEmail) {
            return res.status(400).json({
                message: "Email is required",
            })
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            })
        }

        const user = await User.findOne({
            email: normalizedEmail,
        })

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            })
        }

        // generate reset token
        const resetToken =
            crypto.randomBytes(32).toString("hex")

        // save token
        user.resetPasswordToken = resetToken

        // expire in 15 minutes
        user.resetPasswordExpire =
            Date.now() + 15 * 60 * 1000

        await user.save()

        // reset link
        const resetLink =
            `${process.env.CLIENT_URL}/reset-password/${resetToken}`

        // send email
        try {
            await sendEmail(
                user.email,
                "Reset Your Password",
                `
      <h2>Password Reset</h2>

      <p>Click below to reset your password:</p>

      <a href="${resetLink}">
        Reset Password
      </a>
      `
            )
        } catch (error) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined

            await user.save()

            return res.status(500).json({
                message:
                    "Unable to send password reset email. Please try again.",
            })
        }

        res.status(200).json({
            message: "Password reset email sent",
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }

}
export const resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token",
            })
        }

        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters long",
            })
        }

        // update password
        user.password = req.body.password

        // clear reset fields
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save()

        res.status(200).json({
            message: "Password reset successful",
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const getMe = async (req, res) => {
    res.status(200).json(req.user)
}

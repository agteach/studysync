import jwt from "jsonwebtoken"
import User from "../models/User.js"

const shouldRequireEmailVerification = () =>
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" ||
    process.env.NODE_ENV === "production"

const protect = async (req, res, next) => {
    let token

    try {
        // check authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1]

            // verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // get user from database
            const user = await User.findById(decoded.id).select("-password")

            if (!user) {
                return res.status(401).json({
                    message: "Not authorized, user not found",
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

            req.user = user

            next()
        } else {
            res.status(401).json({
                message: "Not authorized, no token",
            })
        }
    } catch (error) {
        res.status(401).json({
            message: "Not authorized, token failed",
        })
    }
}

export default protect

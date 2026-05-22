import express from "express"
import protect from "../middleware/authMiddleware.js"
import { registerUser, loginUser, getMe, verifyEmail, forgotPassword, resetPassword } from "../controllers/authController.js"

const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/verify/:token", verifyEmail)
router.get("/me", protect, getMe)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)

export default router
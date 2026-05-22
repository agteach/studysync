import express from "express"

import protect from "../middleware/authMiddleware.js"

import {
    createSession,
    getSessions,
    updateSession,
    deleteSession,
} from "../controllers/studySessionController.js"

const router = express.Router()

router.route("/")
    .post(protect, createSession)
    .get(protect, getSessions)

router.route("/:id")
    .put(protect, updateSession)
    .delete(protect, deleteSession)

export default router
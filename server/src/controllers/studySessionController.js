import StudySession from "../models/studySession.js"

const emitSessionChange = (req) => {
    req.app.get("io")?.to(`user:${req.user._id}`).emit(
        "sessions:changed"
    )

    req.app.get("io")?.to(`user:${req.user._id}`).emit(
        "analytics:changed"
    )
}

export const createSession = async (req, res) => {
    try {
        const {
            subject,
            duration,
            scheduledFor,
            notes,
        } = req.body

        if (!subject || !duration || !scheduledFor) {
            return res.status(400).json({
                message: "Required fields missing",
            })
        }

        const session = await StudySession.create({
            subject,
            duration,
            scheduledFor,
            notes,
            user: req.user._id,
        })

        emitSessionChange(req)

        res.status(201).json(session)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const getSessions = async (req, res) => {
    try {
        const sessions = await StudySession.find({
            user: req.user._id,
        }).sort({ scheduledFor: 1 })

        res.status(200).json(sessions)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const updateSession = async (req, res) => {
    try {
        const session = await StudySession.findById(
            req.params.id
        )

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            })
        }

        if (
            session.user.toString() !== req.user._id.toString()
        ) {
            return res.status(401).json({
                message: "Not authorized",
            })
        }

        const updatedSession =
            await StudySession.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            )

        emitSessionChange(req)

        res.status(200).json(updatedSession)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const deleteSession = async (req, res) => {
    try {
        const session = await StudySession.findById(
            req.params.id
        )

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            })
        }

        if (
            session.user.toString() !== req.user._id.toString()
        ) {
            return res.status(401).json({
                message: "Not authorized",
            })
        }

        await session.deleteOne()

        emitSessionChange(req)

        res.status(200).json({
            message: "Session deleted",
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}

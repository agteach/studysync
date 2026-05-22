import mongoose from "mongoose"

const studySessionSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
        },

        duration: {
            type: Number,
            required: true,
        },

        scheduledFor: {
            type: Date,
            required: true,
        },

        completed: {
            type: Boolean,
            default: false,
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },

        notes: {
            type: String,
            default: "",
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },


    },
    {
        timestamps: true,
    }
)

const StudySession = mongoose.model(
    "StudySession",
    studySessionSchema
)

export default StudySession
import mongoose from "mongoose"

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        completed: {
            type: Boolean,
            default: false,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        deadline: {
            type: Date,
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

const Task = mongoose.model("Task", taskSchema)

export default Task
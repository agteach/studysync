import Task from "../models/Task.js"

const emitTaskChange = (req) => {
    req.app.get("io")?.to(`user:${req.user._id}`).emit(
        "tasks:changed"
    )

    req.app.get("io")?.to(`user:${req.user._id}`).emit(
        "analytics:changed"
    )
}

export const createTask = async (req, res) => {
    try {
        const { title, description, priority, deadline } = req.body

        if (!title) {
            return res.status(400).json({
                message: "Title is required",
            })
        }

        const task = await Task.create({
            title,
            description,
            priority,
            deadline,
            user: req.user._id,
        })

        emitTaskChange(req)

        res.status(201).json(task)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user._id,
        }).sort({ createdAt: -1 })

        res.status(200).json(tasks)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            })
        }

        // ownership check
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: "Not authorized",
            })
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )

        emitTaskChange(req)

        res.status(200).json(updatedTask)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            })
        }

        // ownership check
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: "Not authorized",
            })
        }

        await task.deleteOne()

        emitTaskChange(req)

        res.status(200).json({
            message: "Task deleted successfully",
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}

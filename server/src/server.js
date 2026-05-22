import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import http from "http"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { Server } from "socket.io"
import authRoutes from "./routes/authRoutes.js"
import connectDB from "./config/db.js"
import taskRoutes from "./routes/taskRoutes.js"
import studySessionRoutes from "./routes/studySessionRoutes.js"
import startStudyReminderJob from "./jobs/studyReminderJob.js"
import {
    getReminderQueueStatus,
    startReminderQueueWorker,
} from "./jobs/reminderQueue.js"
import analyticsRoutes from "./routes/analyticsRoutes.js"
dotenv.config()

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
})

app.set("io", io)

app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
}))
app.use(express.json())
app.use("/api/auth", authRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/sessions", studySessionRoutes)
app.use("/api/analytics", analyticsRoutes)

app.get("/", (req, res) => {
    res.send("StudySync API Running")
})

app.get("/api/health", (req, res) => {
    const dbStates = [
        "disconnected",
        "connected",
        "connecting",
        "disconnecting",
    ]

    res.status(200).json({
        status: "ok",
        api: "running",
        database:
            dbStates[mongoose.connection.readyState] || "unknown",
        socket: "running",
        cron: "running when database is connected",
        queue: getReminderQueueStatus(),
        services: {
            resend: process.env.RESEND_API_KEY
                ? "configured"
                : "missing RESEND_API_KEY",
            jwt: process.env.JWT_SECRET
                ? "configured"
                : "missing JWT_SECRET",
            clientUrl: CLIENT_URL,
        },
    })
})

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token

        if (!token) {
            return next()
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        socket.userId = decoded.id
        socket.join(`user:${decoded.id}`)

        next()
    } catch {
        next(new Error("Authentication failed"))
    }
})

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.emit("connected", {
        message: "Connected to StudySync realtime server",
    })

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`)
    })
})

const startServer = async () => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })

    const dbConnection = await connectDB()

    if (dbConnection) {
        startReminderQueueWorker()
        startStudyReminderJob()
    }
}

startServer()

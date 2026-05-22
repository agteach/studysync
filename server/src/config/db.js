import mongoose from "mongoose"

mongoose.set("bufferCommands", false)

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not configured")
        }

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        })

        console.log(`MongoDB Connected: ${conn.connection.host}`)

        return conn
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`)

        return null
    }
}

export default connectDB

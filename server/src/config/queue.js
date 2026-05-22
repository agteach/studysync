import { Queue, Worker } from "bullmq"

const buildRedisConnection = () => {
    if (!process.env.REDIS_URL) {
        return null
    }

    try {
        const redisUrl = new URL(process.env.REDIS_URL)

        return {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
            username: redisUrl.username || undefined,
            password: redisUrl.password || undefined,
            tls: redisUrl.protocol === "rediss:" ? {} : undefined,
            maxRetriesPerRequest: null,
        }
    } catch {
        console.error("REDIS_URL is invalid. BullMQ is disabled.")

        return null
    }
}

const connection = buildRedisConnection()

export const isQueueEnabled = () => Boolean(connection)

export const createQueue = (name) => {
    if (!connection) {
        return null
    }

    return new Queue(name, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 30000,
            },
            removeOnComplete: 100,
            removeOnFail: 100,
        },
    })
}

export const createWorker = (name, processor) => {
    if (!connection) {
        return null
    }

    return new Worker(name, processor, {
        connection,
    })
}

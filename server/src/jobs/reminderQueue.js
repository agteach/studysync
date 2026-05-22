import { createQueue, createWorker, isQueueEnabled } from "../config/queue.js"
import StudySession from "../models/studySession.js"
import sendEmail from "../utils/sendEmail.js"

const REMINDER_QUEUE_NAME = "study-reminders"
const reminderQueue = createQueue(REMINDER_QUEUE_NAME)

let reminderWorker = null

const buildReminderEmail = (session) => `
<h2>Upcoming Study Session</h2>

<p>
  Your study session for
  <strong>${session.subject}</strong>
  starts soon.
</p>

<p>
  Duration: ${session.duration} minutes
</p>
`

export const enqueueStudyReminder = async (session) => {
    if (!reminderQueue) {
        return false
    }

    try {
        await reminderQueue.add(
            "send-study-reminder",
            {
                sessionId: session._id.toString(),
            },
            {
                jobId: `study-reminder:${session._id}`,
            }
        )
    } catch (error) {
        console.error(`Reminder queue unavailable: ${error.message}`)

        return false
    }

    return true
}

export const sendStudyReminderNow = async (session) => {
    const user = session.user

    if (!user?.email) {
        throw new Error("Reminder session has no user email")
    }

    await sendEmail(
        user.email,
        "Study Session Reminder",
        buildReminderEmail(session)
    )

    session.reminderSent = true

    await session.save()
}

export const startReminderQueueWorker = () => {
    if (!isQueueEnabled() || reminderWorker) {
        return reminderWorker
    }

    reminderWorker = createWorker(
        REMINDER_QUEUE_NAME,
        async (job) => {
            const session = await StudySession.findById(
                job.data.sessionId
            ).populate("user")

            if (!session || session.completed || session.reminderSent) {
                return
            }

            await sendStudyReminderNow(session)
        }
    )

    reminderWorker.on("completed", (job) => {
        console.log(`Reminder job completed: ${job.id}`)
    })

    reminderWorker.on("failed", (job, error) => {
        console.error(
            `Reminder job failed: ${job?.id || "unknown"} - ${error.message}`
        )
    })

    reminderWorker.on("error", (error) => {
        console.error(`Reminder worker error: ${error.message}`)
    })

    return reminderWorker
}

export const getReminderQueueStatus = () => ({
    enabled: isQueueEnabled(),
    worker: reminderWorker ? "running" : "stopped",
})

import cron from "node-cron"

import StudySession from "../models/studySession.js"

import {
    enqueueStudyReminder,
    sendStudyReminderNow,
} from "./reminderQueue.js"

const startStudyReminderJob = () => {

    // runs every minute
    cron.schedule("* * * * *", async () => {

        console.log("Checking study reminders...")

        try {

            // current time
            const now = new Date()

            // 1 hour ahead
            const oneHourLater =
                new Date(now.getTime() + 60 * 60 * 1000)

            // find sessions
            const sessions = await StudySession.find({
                scheduledFor: {
                    $gte: now,
                    $lte: oneHourLater,
                },

                completed: false,
                reminderSent: false,
            }).populate("user")

            for (const session of sessions) {

                const queued = await enqueueStudyReminder(session)

                if (!queued) {
                    await sendStudyReminderNow(session)
                }

                console.log(
                    queued
                        ? `Reminder queued for ${session.user.email}`
                        : `Reminder sent to ${session.user.email}`
                )
            }

        } catch (error) {
            console.log(error)
        }

    })

}

export default startStudyReminderJob

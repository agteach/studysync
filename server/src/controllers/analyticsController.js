import Task from "../models/Task.js"
import StudySession from "../models/studySession.js"

export const getDashboardAnalytics = async (
    req,
    res
) => {
    try {

        const userId = req.user._id

        // tasks
        const totalTasks =
            await Task.countDocuments({
                user: userId,
            })

        const completedTasks =
            await Task.countDocuments({
                user: userId,
                completed: true,
            })

        // sessions
        const totalSessions =
            await StudySession.countDocuments({
                user: userId,
            })

        const completedSessions =
            await StudySession.countDocuments({
                user: userId,
                completed: true,
            })

        // study duration
        const studySessions =
            await StudySession.find({
                user: userId,
                completed: true,
            })

        const totalStudyMinutes =
            studySessions.reduce(
                (acc, session) =>
                    acc + session.duration,
                0
            )

        // completion rates
        const taskCompletionRate =
            totalTasks === 0
                ? 0
                : (
                    (completedTasks / totalTasks) *
                    100
                ).toFixed(1)

        const sessionCompletionRate =
            totalSessions === 0
                ? 0
                : (
                    (completedSessions /
                        totalSessions) *
                    100
                ).toFixed(1)

        res.status(200).json({

            tasks: {
                total: totalTasks,
                completed: completedTasks,
                completionRate:
                    taskCompletionRate,
            },

            studySessions: {
                total: totalSessions,
                completed:
                    completedSessions,
                completionRate:
                    sessionCompletionRate,
            },

            studyTime: {
                totalMinutes:
                    totalStudyMinutes,

                totalHours:
                    (
                        totalStudyMinutes / 60
                    ).toFixed(1),
            },

        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}

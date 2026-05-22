import { Resend } from "resend"

const sendEmail = async (to, subject, html) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured")
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
        from: "StudySync <onboarding@resend.dev>",
        to,
        subject,
        html,
    })
}

export default sendEmail

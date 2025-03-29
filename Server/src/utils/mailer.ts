import nodemailer from "nodemailer";
import env from "@/config/env.ts";
import logger from "@/config/logger.ts";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE, // true for 465, false for other ports (like 587 using STARTTLS)
    auth: {
        user: env.EMAIL_USER, // Gmail address (or other SMTP user)
        pass: env.EMAIL_PASS, // Gmail App Password (or other SMTP password)
    },
    // Optional: Add proxy, pooling options etc. if needed
    logger: true, // Enable verbose logging from Nodemailer for debugging
    debug: true,
});

// Verify connection configuration on startup (optional but recommended)
transporter.verify((error, _success) => {
    if (error) {
        logger.error(error, "Mailer verification failed. Check EMAIL configuration in .env");
    } else {
        logger.info("Mail server is ready to take messages");
    }
});

interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

/**
 * Sends an email using the pre-configured transporter.
 * @param mailOptions - Options object (to, subject, text, html).
 */
const sendEmail = async (mailOptions: MailOptions): Promise<void> => {
    try {
        const info = await transporter.sendMail({
            from: env.EMAIL_FROM, // Use configured sender address
            ...mailOptions,
        });
        logger.info(`Email sent successfully to ${mailOptions.to}. Message ID: ${info.messageId}`);
    } catch (error) {
        logger.error({ error, recipient: mailOptions.to, subject: mailOptions.subject }, "Error sending email");
        // Decide if you want to re-throw the error or just log it
        // Re-throwing might block processes like password reset if email is critical path
        // throw error; // Uncomment to make email failure block the calling process
    }
};

/**
 * Sends the password reset email specifically.
 * @param to - Recipient email address.
 * @param token - The non-hashed password reset token.
 */
export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`; // Construct URL for frontend

    const subject = "Inventory System - Password Reset Request";
    const textContent = `
    Hello,

    You requested a password reset for your Inventory System account.
    Please use the following link to reset your password:
    ${resetUrl}

    This link will expire in 15 minutes.

    If you did not request a password reset, please ignore this email.

    Thanks,
    The Inventory System Team
    `;
    const htmlContent = `
    <p>Hello,</p>
    <p>You requested a password reset for your Inventory System account.</p>
    <p>Please click the link below to reset your password:</p>
    <p><a href="${resetUrl}" target="_blank">Reset Your Password</a></p>
    <p>This link will expire in <strong>15 minutes</strong>.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,<br/>The Inventory System Team</p>
    `;

    await sendEmail({
        to,
        subject,
        text: textContent,
        html: htmlContent,
    });
};

// Export other email functions if needed (e.g., sendWelcomeEmail)

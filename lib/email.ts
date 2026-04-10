"use server";

let transporter: any = null;

async function getTransporter() {
    if (transporter) return transporter;

    // Dynamically import nodemailer so Next.js client bundler ignores it
    const nodemailer = (await import('nodemailer')).default;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter;
}

export async function sendClaimNotificationEmail(
    finderEmail: string,
    finderName: string,
    itemName: string,
    claimId: string
) {
    // If SMTP isn't configured, just log to console to not break functionality
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[Email Mock] Would send to ${finderEmail} about item ${itemName}`);
        return true;
    }

    try {
        const mailer = await getTransporter();
        const info = await mailer.sendMail({
            from: `"ClaimConnect" <${process.env.SMTP_USER}>`,
            to: finderEmail,
            subject: `Action Required: Someone Claimed Your Found Item!`,
            text: `Hi ${finderName},\n\nSomeone has submitted a claim for the "${itemName}" your reported found. Our AI is currently verifying their contextual answers.\n\nLog in to ClaimConnect to view the claim status and start a secure chat if they are verified!\n\nBest,\nThe ClaimConnect Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 2px solid #3b82f6;">
                        <h2 style="color: #1e293b; margin: 0;">ClaimConnect</h2>
                    </div>
                    <div style="padding: 30px 20px;">
                        <p style="font-size: 16px;">Hi <strong>${finderName}</strong>,</p>
                        <p style="font-size: 16px; line-height: 1.5;">
                            Great news! Someone has submitted a claim for the <strong>"${itemName}"</strong> you reported finding. 
                        </p>
                        <p style="font-size: 16px; line-height: 1.5;">
                            Our multi-layer AI verification engine is currently analyzing their responses to security questions to ensure they are the true owner.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                                View Dashboard
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 40px;">
                            Thank you for making the world a more trustworthy place.<br>
                            The ClaimConnect Team
                        </p>
                    </div>
                </div>
            `,
        });

        console.log(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending claim notification email:', error);
        return false;
    }
}

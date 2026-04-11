const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = async (toEmail, username, userId) => {
    const verifyUrl = `http://localhost:5000/api/auth/verify-email?id=${userId}`;

    await transporter.sendMail({
        from:    `"MindLeap Team" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: '✅ Verify Your Email – MindLeap',
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 0;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table width="600" cellpadding="0" cellspacing="0"
                       style="background:#ffffff;border-radius:16px;
                              box-shadow:0 4px 24px rgba(0,0,0,0.08);
                              overflow:hidden;max-width:95%;">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);
                                   padding:40px 48px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:28px;
                                       font-weight:700;letter-spacing:0.5px;">
                                🧠 MindLeap
                            </h1>
                            <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">
                                Your journey to a better mind starts here
                            </p>
                        </td>
                    </tr>

                    <!-- Banner bar -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#7C3AED,#EC4899);
                                   height:4px;"></td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:48px 48px 32px;">

                            <!-- Greeting -->
                            <p style="margin:0 0 8px;font-size:22px;font-weight:700;
                                      color:#1e1b4b;">
                                Hi ${username} 👋
                            </p>
                            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                                Welcome to <strong style="color:#4F46E5;">MindLeap</strong>!
                                We're thrilled to have you on board. Just one quick step —
                                please verify your email address to activate your account
                                and start your journey.
                            </p>

                            <!-- Verify Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 36px;">
                                        <a href="${verifyUrl}"
                                           style="display:inline-block;
                                                  padding:16px 48px;
                                                  background:linear-gradient(135deg,#4F46E5,#7C3AED);
                                                  color:#ffffff;
                                                  font-size:16px;
                                                  font-weight:700;
                                                  text-decoration:none;
                                                  border-radius:50px;
                                                  letter-spacing:0.5px;
                                                  box-shadow:0 4px 15px rgba(79,70,229,0.4);">
                                            ✅ &nbsp; Verify My Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;" />

                            <!-- What's next -->
                            <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1e1b4b;">
                                What happens next?
                            </p>
                            <table cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding:10px 0;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width:36px;height:36px;background:#ede9fe;
                                                           border-radius:50%;text-align:center;
                                                           vertical-align:middle;font-size:16px;">
                                                    🔍
                                                </td>
                                                <td style="padding-left:14px;font-size:14px;
                                                           color:#4b5563;line-height:1.6;">
                                                    <strong style="color:#1e1b4b;">Explore</strong><br/>
                                                    Discover everything MindLeap has to offer.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width:36px;height:36px;background:#ede9fe;
                                                           border-radius:50%;text-align:center;
                                                           vertical-align:middle;font-size:16px;">
                                                    📊
                                                </td>
                                                <td style="padding-left:14px;font-size:14px;
                                                           color:#4b5563;line-height:1.6;">
                                                    <strong style="color:#1e1b4b;">Track Progress</strong><br/>
                                                    Monitor your growth and achievements over time.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 0;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="width:36px;height:36px;background:#ede9fe;
                                                           border-radius:50%;text-align:center;
                                                           vertical-align:middle;font-size:16px;">
                                                    🎯
                                                </td>
                                                <td style="padding-left:14px;font-size:14px;
                                                           color:#4b5563;line-height:1.6;">
                                                    <strong style="color:#1e1b4b;">Reach Your Goals</strong><br/>
                                                    Get personalized recommendations tailored just for you.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Security Note -->
                    <tr>
                        <td style="padding:0 48px 40px;">
                            <div style="background:#f9fafb;border-left:4px solid #4F46E5;
                                        border-radius:8px;padding:16px 20px;">
                                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                                    🔒 If you didn't create an account with MindLeap,
                                    you can safely ignore this email. Your email address
                                    will not be used without verification.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                                   padding:28px 48px;text-align:center;">
                            <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">
                                © 2025 MindLeap. All rights reserved.
                            </p>
                            <p style="margin:0;font-size:12px;color:#d1d5db;">
                                Made with ❤️ by the MindLeap Team.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- End Card -->

            </td>
        </tr>
    </table>

</body>
</html>
        `,
    });
};

module.exports = { sendVerificationEmail };
const nodemailer = require('nodemailer');

exports.sendCertificateEmail = async (toEmail, userName, courseTitle, pdfPath) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  const mailOptions = {
    from: `"MedicoJobs Learning" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Certificate for ${courseTitle}`,
    text: `Hi ${userName},\n\nCongratulations on completing "${courseTitle}"!\n\nPlease find your certificate of completion attached to this email.\n\nBest regards,\nThe MedicoJobs Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #059669;">Congratulations, ${userName}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          You have successfully completed <strong>"${courseTitle}"</strong>.
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          We are thrilled to present you with your Certificate of Completion, attached as a PDF to this email.
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          Keep up the great work learning and expanding your medical knowledge!
        </p>
        <br/>
        <p style="color: #94a3b8; font-size: 14px;">
          Best regards,<br/>
          <strong>The MedicoJobs Team</strong>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf`,
        path: pdfPath,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

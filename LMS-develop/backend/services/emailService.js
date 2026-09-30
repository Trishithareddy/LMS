const nodemailer = require("nodemailer");

const sendTeacherCredentials = async (email, username, password, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your LMS Teacher Account Credentials",
      html: `
        <h3>Hello ${name},</h3>
        <p>Your teacher account has been created.</p>

        <b>Login Details</b><br/>
        Username: ${username}<br/>
        Password: ${password}<br/><br/>

        Please login.

        <br/><br/>
        Regards,<br/>
        SuperTeacher LMS Admin
      `,
    };

    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendTeacherCredentials };
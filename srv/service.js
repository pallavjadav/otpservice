const cds = require("@sap/cds");
const moment = require("moment");
const nodemailer = require("nodemailer");
const expirationTimeinMin = 2;
const blockPeriodInMin = 2;

module.exports = cds.service.impl(async function () {
  const OTP = 'otp.OTP'

  this.on("generateAndSendOTP", async (req) => {
    try {
      const { userId } = req.data;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const expirationTime = moment()
        .add(expirationTimeinMin, "minutes")
        .toDate();
      const blockedUntil = moment().add(blockPeriodInMin, "minutes").toDate();

      // Check if user is blocked
      const userOTP = await SELECT.one.from(OTP).where({ userId });

      if (
        userOTP &&
        Date.parse(userOTP.blockedUntil) > Date.parse(new Date().toISOString())
      ) {
        req.reject(400, "User is blocked. Please try again later.");
        // throw new Error("User is blocked. Please try again late");
      }

      if (userOTP) {
        await UPDATE(OTP)
          .set({ otp, createdAt: expirationTime, attemptCount: 0 })
          .where({ userId });
      } else {
        await INSERT.into(OTP).entries({
          userId,
          otp,
          createdAt: expirationTime,
        });
      }
      await sendOtpEmail(otp, userId, expirationTimeinMin);
    } catch (error) {
      console.log(error)
    }
  });

  this.on("verifyOTP", async (req) => {
    const { userId, otp } = req.data;
    const db = await cds.connect.to('db');
    const tx = db.tx(req);

    // try {
    const userOTP = await tx.run(SELECT.one.from(OTP).where({ userId }));
    // await tx.commit();

    if (!userOTP) {
      req.reject(400, "Invalid OTP");
    }

    if (userOTP.blockedUntil > new Date()) {
      req.reject(401, "User is blocked. Please try again later.");
    }

    if (userOTP.attemptCount >= 3) {
      await tx.run(
        UPDATE(OTP).set({ blockedUntil: new Date(Date.now() + 2 * 60000).toISOString() }).where({ userId })
      );
      await tx.commit();
      req.reject(429, "Too many incorrect attempts. User is blocked for 1 hour.");
    }

    if (userOTP.otp !== otp) {
      await tx.run(
        UPDATE(OTP).set({ attemptCount: userOTP.attemptCount + 1 }).where({ userId })
      );
      await tx.commit();
      req.reject(400, "Invalid OTP");
    }

    if (userOTP.createdAt < new Date()) {
      req.reject(400, "OTP expired. Please resend the OTP.");
    }

    // OTP is correct, delete the OTP entry
    await tx.run(DELETE.from(OTP).where({ userId }));

    // await tx.commit();

    return {
      status: "SUCCESS"
    };

  });


  // Function to send OTP email
  async function sendOtpEmail(otp, email, expirationTimeinMin) {
    // Create a transporter object using SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'pallavjadav@gmail.com',
        pass: 'aetchgbkavpcgtpp'
      },
    });

    // Email content
    let mailOptions = {
      from: '"Pallavkumar Jadav - Nodemailer OTP Service - DEMO" <your-email@gmail.com>', // Sender address
      to: email, // List of receivers
      subject: "Your OTP Code", // Subject line
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Email</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding: 10px 0;
                }
                .header img {
                    max-width: 100px;
                }
                .content {
                    text-align: center;
                    padding: 20px 0;
                }
                .otp {
                    font-size: 24px;
                    font-weight: bold;
                    background-color: #e0e0e0;
                    padding: 10px;
                    border-radius: 5px;
                    display: inline-block;
                    margin: 20px 0;
                }
                .footer {
                    font-size: 12px;
                    color: #777;
                    text-align: center;
                    padding: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://cdn-icons-png.flaticon.com/512/2344/2344282.png" alt="Your Brand Logo">
                </div>
                <div class="content">
                    <h1>Your OTP Code</h1>
                    <p>Dear user,</p>
                    <p>Use the following One-Time Password (OTP) to complete your transaction:</p>
                    <div class="otp">${otp}</div>
                    <p>This OTP is valid for the next ${expirationTimeinMin} minutes. Please do not share it with anyone.</p>
                </div>
                <div class="footer">
                    <p>If you did not request this OTP, please ignore this email or contact support.</p>
                    <p>&copy; 2024 Your Brand. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>`, // HTML body
    };

    // Send mail with defined transport object
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }


});

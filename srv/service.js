const cds = require("@sap/cds");
const moment = require("moment");
const nodemailer = require("nodemailer");

const expirationTimeinMin = process.env.otpExpiryInMin || 2;
const blockPeriodInMin = process.env.blockOtpInMin || 2;
const doSpawn = process.env.cleanupDB || true; // Enable the cleanup job
const spawnIn = process.env.cleanupFrequencyInHours * 60 * 60 * 1000 || 6 * 60 * 60 * 1000; // 10 sec in ms

module.exports = cds.service.impl(async function () {
  const OTP = 'otp.OTP';

  this.on("generateAndSendOTP", async (req) => {
    try {
      const { userId } = req.data;
      const otp = generateOtp();
      const expirationTime = moment().add(expirationTimeinMin, "minutes").toDate();
      const blockedUntil = moment().add(blockPeriodInMin, "minutes").toDate();

      const userOTP = await SELECT.one.from(OTP).where({ userId });

      if (isUserBlocked(userOTP)) {
        return req.reject(400, "User is blocked. Please try again later.");
      }

      await upsertOtpEntry(userId, otp, expirationTime);
      var sendOTP = await sendOtpEmail(otp, userId, expirationTimeinMin);
      if (sendOTP === 'success') {
        return {
          status: "SUCCESS"
        }
      } else {
        req.reject(400, 'OTP Send Failed')
      }
    } catch (error) {
      console.log(error);
    }
  });

  this.on("verifyOTP", async (req) => {
    const { userId, otp } = req.data;
    const db = await cds.connect.to('db');
    const tx = db.tx(req);

    // try {
    const userOTP = await tx.run(SELECT.one.from(OTP).where({ userId }));

    if (!userOTP) {
      return req.reject(400, "Invalid OTP");
    }

    if (isUserBlocked(userOTP)) {
      return req.reject(401, "User is blocked. Please try again later.");
    }

    if (userOTP.attemptCount >= 3) {
      await blockUser(tx, userId);
      return req.reject(429, "Too many incorrect attempts. User is blocked for 2 minutes.");
    }

    if (userOTP.otp !== otp) {
      await incrementAttemptCount(tx, userId, userOTP.attemptCount);
      return req.reject(400, "Invalid OTP");
    }

    if (userOTP.expirationTime < new Date()) {
      return req.reject(400, "OTP expired. Please resend the OTP.");
    }

    await tx.run(DELETE.from(OTP).where({ userId }));
    // await tx.commit();

    return { status: "SUCCESS" };
    // } catch (error) {
    //   console.log(error);
    //   await tx.rollback();
    //   req.reject(500, "Internal Server Error");
    // }
  });

  let job = cds.spawn({ every: spawnIn }, async (tx) => {
    if (doSpawn) {
      console.log('Running cleanup job');
      await tx.run(
        DELETE.from(OTP).where({ expirationTime: { '<': new Date().toISOString() } })
      );
    }
  });

  if (!doSpawn) {
    clearInterval(job.timer);
  }
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isUserBlocked(userOTP) {
  return userOTP && Date.parse(userOTP.blockedUntil) > Date.parse(new Date().toISOString());
}

async function upsertOtpEntry(userId, otp, expirationTime) {
  const existingOTP = await SELECT.one.from('otp.OTP').where({ userId });

  if (existingOTP) {
    await UPDATE('otp.OTP')
      .set({ otp, expirationTime, attemptCount: 0 })
      .where({ userId });
  } else {
    await INSERT.into('otp.OTP').entries({
      userId,
      otp,
      expirationTime,
    });
  }
}

async function blockUser(tx, userId) {
  await tx.run(
    UPDATE('otp.OTP').set({
      blockedUntil: new Date(Date.now() + blockPeriodInMin * 60000).toISOString()
    }).where({ userId })
  );
  await tx.commit();
}

async function incrementAttemptCount(tx, userId, currentCount) {
  await tx.run(
    UPDATE('otp.OTP').set({ attemptCount: currentCount + 1 }).where({ userId })
  );
  await tx.commit();
}

async function sendOtpEmail(otp, email, expirationTimeinMin) {
  var config = JSON.parse(process.env.config) || { "service": "gmail", "auth": { "user": "pallavjadav@gmail.com", "pass": "aetchgbkavpcgtpp" } }
  const transporter = nodemailer.createTransport(config);

  const mailOptions = {
    from: '"Pallavkumar Jadav - Nodemailer OTP Service - DEMO" <your-email@gmail.com>',
    to: email,
    subject: "Your OTP Code",
    html: generateEmailHtml(otp, expirationTimeinMin),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return 'success'
  } catch (error) {
    console.error("Error sending email:", error);
    return 'error'
  }
}

function generateEmailHtml(otp, expirationTimeinMin) {
  return `
    <!DOCTYPE html>
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
    </html>`;
}

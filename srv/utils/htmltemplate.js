module.exports = {generateEmailHTML}
function generateEmailHTML(otp, expirationTimeinMin, brandLogoURL, brandName, emailSubject, backgroundColor, textColor, containerWidth, boxShadow) {
    // Default values if not provided
    otp = otp || "XXXXXX";
    expirationTimeinMin = expirationTimeinMin || 10; // Default expiration time is 10 minutes
    brandLogoURL = brandLogoURL || "https://cdn-icons-png.flaticon.com/512/2344/2344282.png"; // Default brand logo URL
    brandName = brandName || "Your Brand"; // Default brand name
    emailSubject = emailSubject || "OTP Email"; // Default email subject
    backgroundColor = backgroundColor || "#f9f9f9"; // Default background color
    textColor = textColor || "#333"; // Default text color
    containerWidth = containerWidth || "100%"; // Default container width
    boxShadow = boxShadow || "0 0 10px rgba(0, 0, 0, 0.1)"; // Default box shadow

    // HTML template with placeholders replaced by input values
    const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${emailSubject}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: ${backgroundColor};
                    color: ${textColor};
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: ${containerWidth};
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    box-shadow: ${boxShadow};
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
                    <img src="${brandLogoURL}" alt="${brandName} Logo">
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
                    <p>&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return htmlTemplate;
}

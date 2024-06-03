# OTP Service with Node.js and SAP CAP

This repository contains a Node.js application implementing an OTP (One-Time Password) service using SAP CAP (Cloud Application Programming Model). The service allows users to generate and verify OTPs via email.

## Features

- Generate and send OTPs via email.
- Verify OTPs provided by users.
- Block users after multiple incorrect OTP attempts.
- Automatic cleanup of expired OTPs.

## Requirements

- Node.js
- SAP CAP
- `@sap/cds` package
- `moment` package
- `nodemailer` package

## Configurable Parameters

```text 
otpExpiryInMin=2 //OTP Expiry
blockUserInMin=2 //Blocking user from sending and validating the otp
blockAttempt=5 //Attempts after which the block is triggered
isCleanupDB=true //Flag to set clean up records in db for expired otps
cleanupFrequencyInHours=6 //Frequency of cleaning up records 
config={"service":"gmail","auth":{"user":"<email>","pass":"<password>"}}  // Node Mailer config for sending otp in mail
```
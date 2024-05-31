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
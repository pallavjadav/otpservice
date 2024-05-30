namespace otp;

using { managed } from '@sap/cds/common';
type Email             : String @assert.format: '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,4}$';

entity OTP : managed {
  key ID         : UUID;
  userId         : Email;
  otp            : String(6);
  createdAt      : DateTime;
  attemptCount   : Integer default 0;
  blockedUntil   : DateTime;
}

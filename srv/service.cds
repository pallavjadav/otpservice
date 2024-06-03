type Email : String @assert.format: '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,4}$';
type OTPType : String @assert.format:'^\d{6}$';
using {otp} from '../db/schema';

@protocol: ['rest']
service OTPService {
    @readonly
    entity OTP as projection on otp.OTP;
    action generateAndSendOTP(userId: Email) returns {
         status: String;
         OTP: OTPType;
    };
    action generateAndSendOTPbyMail(userId : Email) returns {
        status: String;
    };
    action verifyOTP(userId : Email, otp : OTPType) returns {
        status: String;
    };
}

type Email : String @assert.format: '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,4}$';

using {otp} from '../db/schema';

@protocol: ['rest']
service OTPService {
    entity OTP as projection on otp.OTP;
    action generateAndSendOTP(userId : Email);
    action verifyOTP(userId : Email, otp : String(6)) returns {
        status: String;
    };
}

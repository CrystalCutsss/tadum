// Публичный API фичи verify-otp: экран ввода кода (SC-01).
export { OtpForm, type OtpFormProps } from './ui/otp-form';
export {
  canResend,
  inputLocked,
  otpErrorFrom,
  otpErrorMessage,
  otpFailReason,
  showAttemptsLeft,
  type OtpFormError,
} from './model/errors';

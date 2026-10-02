/**
 * Email Dispatcher Service
 * Primary provider: Resend (https://resend.com)
 * Re-exports all Resend email functions for transparent compatibility across existing routes.
 */

export * from '@/lib/resend';
export { isResendConfigured as isMailgunConfigured } from '@/lib/resend';

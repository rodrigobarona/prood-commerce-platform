// ---------------------------------------------------------------------------
// @prood/email — React Email templates for Prood notifications
// ---------------------------------------------------------------------------

export { ActivationEmail, type ActivationEmailProps } from '../emails/activation.js'
export { WelcomeEmail, type WelcomeEmailProps } from '../emails/welcome.js'
export {
  OrderConfirmationEmail,
  type OrderConfirmationEmailProps,
} from '../emails/order-confirmation.js'
export { OrderShippedEmail, type OrderShippedEmailProps } from '../emails/order-shipped.js'
export { OrderRefundedEmail, type OrderRefundedEmailProps } from '../emails/order-refunded.js'
export { PasswordResetEmail, type PasswordResetEmailProps } from '../emails/password-reset.js'
export { TeamInviteEmail, type TeamInviteEmailProps } from '../emails/team-invite.js'
export { EmailLayout, type EmailLayoutProps } from '../emails/components/layout.js'
export { EmailFooter, type EmailFooterProps } from '../emails/components/footer.js'
export { proodTailwindConfig } from '../emails/theme.js'

export type EmailTemplateId =
  | 'activation'
  | 'welcome'
  | 'order-confirmation'
  | 'order-shipped'
  | 'order-refunded'
  | 'password-reset'
  | 'team-invite'

export const EMAIL_TEMPLATE_IDS = [
  'activation',
  'welcome',
  'order-confirmation',
  'order-shipped',
  'order-refunded',
  'password-reset',
  'team-invite',
] as const satisfies readonly EmailTemplateId[]

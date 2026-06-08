// ---------------------------------------------------------------------------
// ResendNotificationProvider — email delivery via Resend + React Email
// ---------------------------------------------------------------------------

import { createElement, type ReactElement } from 'react'
import { Resend } from 'resend'
import {
  ActivationEmail,
  OrderConfirmationEmail,
  OrderShippedEmail,
  OrderRefundedEmail,
  PaymentFailedEmail,
  PasswordResetEmail,
  TeamInviteEmail,
  WelcomeEmail,
  type ActivationEmailProps,
  type EmailTemplateId,
  type OrderConfirmationEmailProps,
  type OrderShippedEmailProps,
  type OrderRefundedEmailProps,
  type PaymentFailedEmailProps,
  type PasswordResetEmailProps,
  type TeamInviteEmailProps,
  type WelcomeEmailProps,
} from '@prood/email'
import type {
  NotificationChannel,
  NotificationMessage,
  NotificationProvider,
  NotificationResult,
} from '@prood/types'

import type { ResendConfig } from './types.js'

function renderTemplate(
  template: EmailTemplateId,
  data: Record<string, unknown>,
): ReactElement | null {
  switch (template) {
    case 'activation':
      return createElement(ActivationEmail, data as unknown as ActivationEmailProps)
    case 'welcome':
      return createElement(WelcomeEmail, data as unknown as WelcomeEmailProps)
    case 'order-confirmation':
      return createElement(OrderConfirmationEmail, data as unknown as OrderConfirmationEmailProps)
    case 'order-shipped':
      return createElement(OrderShippedEmail, data as unknown as OrderShippedEmailProps)
    case 'order-refunded':
      return createElement(OrderRefundedEmail, data as unknown as OrderRefundedEmailProps)
    case 'payment-failed':
      return createElement(PaymentFailedEmail, data as unknown as PaymentFailedEmailProps)
    case 'password-reset':
      return createElement(PasswordResetEmail, data as unknown as PasswordResetEmailProps)
    case 'team-invite':
      return createElement(TeamInviteEmail, data as unknown as TeamInviteEmailProps)
    default: {
      const _exhaustive: never = template
      return _exhaustive
    }
  }
}

function isEmailTemplateId(value: string | undefined): value is EmailTemplateId {
  return (
    value === 'activation' ||
    value === 'welcome' ||
    value === 'order-confirmation' ||
    value === 'order-shipped' ||
    value === 'order-refunded' ||
    value === 'payment-failed' ||
    value === 'password-reset' ||
    value === 'team-invite'
  )
}

/**
 * Resend notification provider for transactional email.
 *
 * @example
 * ```ts
 * const resend = new ResendNotificationProvider({
 *   apiKey: process.env.RESEND_API_KEY!,
 *   defaultFrom: process.env.RESEND_FROM_EMAIL!,
 * })
 *
 * await resend.send('email', {
 *   to: 'customer@example.com',
 *   subject: 'Confirm your email',
 *   template: 'activation',
 *   data: { companyName: 'Prood', url: 'https://example.com/activate' },
 * })
 * ```
 */
export class ResendNotificationProvider implements NotificationProvider {
  readonly id = 'resend'
  readonly name = 'Resend'
  readonly channels: NotificationChannel[] = ['email']

  private readonly resend: Resend
  private readonly defaultFrom: string

  constructor(config: ResendConfig) {
    const apiKey = config.apiKey?.trim()
    const defaultFrom = config.defaultFrom?.trim()

    if (!apiKey) {
      throw new Error('ResendNotificationProvider requires a Resend API key')
    }
    if (!defaultFrom) {
      throw new Error('ResendNotificationProvider requires a default sender address')
    }
    this.resend = config.client ?? new Resend(apiKey)
    this.defaultFrom = defaultFrom
  }

  async send(channel: NotificationChannel, message: NotificationMessage): Promise<NotificationResult> {
    if (channel !== 'email') {
      return {
        success: false,
        error: `ResendNotificationProvider only supports the email channel (received "${channel}")`,
      }
    }

    if (!message.subject) {
      return {
        success: false,
        error: 'NotificationMessage.subject is required for email delivery',
      }
    }

    try {
      const payload = {
        from: this.defaultFrom,
        to: [message.to],
        subject: message.subject,
      }

      if (isEmailTemplateId(message.template) && message.data) {
        const react = renderTemplate(message.template, message.data)

        const { data, error } = await this.resend.emails.send({
          ...payload,
          react,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, messageId: data?.id }
      }

      if (message.html) {
        const { data, error } = await this.resend.emails.send({
          ...payload,
          html: message.html,
          ...(message.text ? { text: message.text } : {}),
        })

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, messageId: data?.id }
      }

      if (message.text) {
        const { data, error } = await this.resend.emails.send({
          ...payload,
          text: message.text,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true, messageId: data?.id }
      }

      return {
        success: false,
        error: 'NotificationMessage must include template + data, html, or text',
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown Resend error'
      return { success: false, error: messageText }
    }
  }
}

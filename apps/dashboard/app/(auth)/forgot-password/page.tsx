import { AuthPage } from "@/components/auth/auth-page"
import { ForgotPasswordPanel } from "@/components/auth/auth-panels"

export const metadata = { title: "Reset your password" }

export default function ForgotPasswordPage() {
  return (
    <AuthPage image="keys-door" line="Open your store. Keep the keys.">
      <ForgotPasswordPanel />
    </AuthPage>
  )
}

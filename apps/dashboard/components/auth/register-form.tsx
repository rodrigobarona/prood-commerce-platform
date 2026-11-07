"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { PageHeader } from "@prood/ui/components/page-header"
import { PasswordInput } from "@prood/ui/components/password-input"
import { PASSWORD_HINT } from "@prood/ui/lib/auth-fields"
import { ClientStoreHint, StoreAddressField } from "@/components/auth/store-address-field"
import { authClient } from "@/lib/auth/client"
import { isExistingAccount, signUpErrorMessage } from "@/lib/auth/messages"
import { signUpErrors, type SignUpErrors } from "@/lib/auth/sign-up-errors"
import { addressFromName, createStore } from "@/lib/create-store"
import { requiredEnv, safeRedirectPath } from "@prood/types"

const webUrl = requiredEnv(process.env.NEXT_PUBLIC_WEB_URL, "NEXT_PUBLIC_WEB_URL")

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirectPath(searchParams.get("redirect"))
  // Invited teammates join an existing store instead of creating one.
  const joiningStore = redirect.startsWith("/invite/")

  const [name, setName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [accountExists, setAccountExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SignUpErrors>({})

  const loginHref = redirect === "/" ? "/login" : `/login?redirect=${encodeURIComponent(redirect)}`

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found = signUpErrors({ name, storeName, email, password }, { needsStore: !joiningStore })
    setFieldErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setLoading(true)
    setError(null)
    setAccountExists(false)

    try {
      const { error: signUpError } = await authClient.signUp.email({ name, email, password })
      if (signUpError) {
        setLoading(false)
        setError(signUpErrorMessage(signUpError))
        setAccountExists(isExistingAccount(signUpError))
        return
      }
    } catch {
      setLoading(false)
      setError("We couldn't create your account. The request didn't finish. Try again.")
      return
    }

    if (joiningStore) {
      router.push(redirect)
      router.refresh()
      return
    }

    const result = await createStore(storeName, storeAddress ?? addressFromName(storeName))
    if ("error" in result) {
      setLoading(false)
      setError(result.error)
      return
    }

    setLoading(false)
    toast.success(`Your store is at ${result.host}.`)
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={joiningStore ? "Create your account" : "Open your store"}
        description={
          joiningStore
            ? "Create an account to accept your invitation."
            : "Free for 50 products and 100 orders a month."
        }
      />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldError id="name-error" message={fieldErrors.name} />
        </div>
        {joiningStore ? null : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storeName">Store name</Label>
            <Input
              id="storeName"
              required
              aria-invalid={fieldErrors.storeName ? true : undefined}
              aria-describedby={fieldErrors.storeName ? "storeName-error" : "storeName-hint"}
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
            />
            <FieldError id="storeName-error" message={fieldErrors.storeName} />
            <ClientStoreHint id="storeName-hint" />
          </div>
        )}
        {joiningStore ? null : (
          <StoreAddressField value={storeAddress ?? addressFromName(storeName)} onChange={setStoreAddress} />
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError id="email-error" message={fieldErrors.email} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            required
            autoComplete="new-password"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError id="password-error" message={fieldErrors.password} />
          <p id="password-hint" className="text-xs text-muted-foreground">
            {PASSWORD_HINT}
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-pretty text-destructive">
            {error}
            {accountExists ? (
              <>
                {" "}
                <Link href={loginHref} className="underline underline-offset-4">
                  Sign in instead
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        <Button type="submit" size="lg" variant={joiningStore ? "default" : "brand"} disabled={loading}>
          {loading ? "Creating..." : joiningStore ? "Create account" : "Create account and store"}
        </Button>
        <p className="text-xs text-pretty text-muted-foreground">
          By creating an account you agree to the{" "}
          <a href={`${webUrl}/terms`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            terms of service
          </a>{" "}
          and{" "}
          <a href={`${webUrl}/dpa`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            data processing terms
          </a>
          . Read how we handle your data in the{" "}
          <a href={`${webUrl}/privacy`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            privacy policy
          </a>
          .
        </p>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginHref} className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { authClient } from "@/lib/auth/client"
import { safeRedirectPath } from "@/lib/safe-redirect"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirectPath(searchParams.get("redirect"))
  // Invited teammates join an existing store instead of creating one.
  const joiningStore = redirect.startsWith("/invite/")

  const [name, setName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await authClient.signUp.email({ name, email, password })
    if (signUpError) {
      setLoading(false)
      setError(signUpError.message ?? "Sign up failed")
      return
    }

    if (joiningStore) {
      router.push(redirect)
      router.refresh()
      return
    }

    // Create the merchant's first store (organization) and make it active.
    const slug = `${slugify(storeName) || "store"}-${Math.random().toString(36).slice(2, 7)}`
    const { data: org, error: orgError } = await authClient.organization.create({
      name: storeName,
      slug,
    })
    if (orgError || !org) {
      setLoading(false)
      setError(orgError?.message ?? "Could not create your store")
      return
    }

    const { error: setActiveError } = await authClient.organization.setActive({
      organizationId: org.id,
    })
    if (setActiveError) {
      setLoading(false)
      setError(setActiveError.message ?? "Could not activate your store")
      return
    }

    setLoading(false)
    router.push("/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{joiningStore ? "Create your account" : "Create your store"}</CardTitle>
        <CardDescription>
          {joiningStore
            ? "Create an account to accept your invitation."
            : "Set up your account and your first store to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          {joiningStore ? null : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="storeName">Store name</Label>
              <Input
                id="storeName"
                required
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={redirect === "/" ? "/login" : `/login?redirect=${encodeURIComponent(redirect)}`}
              className="text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

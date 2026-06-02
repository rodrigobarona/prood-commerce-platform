import { type NextRequest } from "next/server"
import { proxyAuthRequest } from "@/lib/auth/proxy"

export async function GET(request: NextRequest) {
  return proxyAuthRequest(request)
}

export async function POST(request: NextRequest) {
  return proxyAuthRequest(request)
}

export async function PATCH(request: NextRequest) {
  return proxyAuthRequest(request)
}

export async function PUT(request: NextRequest) {
  return proxyAuthRequest(request)
}

export async function DELETE(request: NextRequest) {
  return proxyAuthRequest(request)
}

export async function OPTIONS(request: NextRequest) {
  return proxyAuthRequest(request)
}

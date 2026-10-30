// Same-origin auth endpoints, forwarded to the apps/api auth issuer.
export {
  proxyAuthRequest as GET,
  proxyAuthRequest as POST,
  proxyAuthRequest as PATCH,
  proxyAuthRequest as PUT,
  proxyAuthRequest as DELETE,
  proxyAuthRequest as OPTIONS,
} from "@prood/auth/proxy"

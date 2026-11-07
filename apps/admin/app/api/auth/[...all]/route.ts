// Same-origin auth endpoints, forwarded to the apps/api auth issuer. The admin never trusts a device.
export {
  proxyAdminAuthRequest as GET,
  proxyAdminAuthRequest as POST,
  proxyAdminAuthRequest as PATCH,
  proxyAdminAuthRequest as PUT,
  proxyAdminAuthRequest as DELETE,
  proxyAdminAuthRequest as OPTIONS,
} from "@prood/auth/proxy"

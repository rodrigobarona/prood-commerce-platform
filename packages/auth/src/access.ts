import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

const apiKeyActions = ["create", "read", "update", "delete"] as const

const ac = createAccessControl({ ...defaultStatements, apiKey: apiKeyActions })

/**
 * Store roles for the organization plugin. The API key plugin asks for `apiKey`
 * permissions, which the defaults don't define, so admins need them spelled out.
 */
export const storeAccess = {
  ac,
  roles: {
    owner: ac.newRole({ ...ownerAc.statements, apiKey: apiKeyActions }),
    admin: ac.newRole({ ...adminAc.statements, apiKey: apiKeyActions }),
    member: ac.newRole(memberAc.statements),
  },
}

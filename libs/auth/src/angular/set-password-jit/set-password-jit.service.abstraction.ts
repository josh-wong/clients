import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { PBKDF2KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { UserId } from "@bitwarden/common/types/guid";
import { MasterKey } from "@bitwarden/common/types/key";

export interface SetPasswordCredentials {
  masterKey: MasterKey;
  masterKeyHash: string;
  localMasterKeyHash: string;
  kdfConfig: PBKDF2KdfConfig;
  hint: string;
  orgSsoIdentifier: string;
  userId: UserId;
}

/**
 * This service handles setting a password for a "just-in-time" provisioned user.
 *
 * A "just-in-time" (JIT) provisioned user is a user who does not have a registered account at the
 * time they first click "Login with SSO". Once they click "Login with SSO" we register the account on
 * the fly ("just-in-time").
 */
export abstract class SetPasswordJitService {
  resetPasswordAutoEnroll: boolean;
  masterPasswordPolicyOptions: MasterPasswordPolicyOptions;
  /**
   * Sets the password for a JIT provisioned user.
   *
   * @param credentials An object of the credentials needed to set the password for a JIT provisioned user
   * @throws If any property on the `credentials` object is null or undefined, or if a protectedUserKey
   *         or newKeyPair could not be created.
   */
  setPassword: (credentials: SetPasswordCredentials) => Promise<void>;
  /**
   * Gets the auto enroll status of the organization and uses it to set the orgId, resetPasswordAutoEnroll,
   * and masterPasswordPolicyOptions for use in the service.
   * @param orgSsoIdentifier The identifier of the SSO organization
   * @throws If the auto enroll status cannot be found
   */
  resolveOrgAutoEnrollData: (orgSsoIdentifier: string) => Promise<void>;
  /**
   *  Sets the orgId, resetPasswordAutoEnroll, and masterPasswordPolicyOptions to null.
   */
  clearOrgData: () => void;
}

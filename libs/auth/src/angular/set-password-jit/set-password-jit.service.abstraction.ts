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
  orgId: string;
  resetPasswordAutoEnroll: boolean;
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
  /**
   * Sets the password for a JIT provisioned user.
   *
   * @param credentials An object of the credentials needed to set the password for a JIT provisioned user
   */
  setPassword: (credentials: SetPasswordCredentials) => Promise<void>;
  /**
   * Runs client-specific code after the password has been successfully set.
   * This method is should be overridden in clients that need to run code
   * after the password has been set.
   * @see WebSetPasswordJitService
   * @see DesktopSetPasswordJitService
   */
  runClientSpecificLogicAfterSetPasswordSuccess: () => Promise<void> | null;
}

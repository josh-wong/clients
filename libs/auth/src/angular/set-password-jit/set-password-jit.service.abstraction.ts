import { UserId } from "@bitwarden/common/types/guid";

import { PasswordInputResult } from "../input-password/password-input-result";

export abstract class SetPasswordJitService {
  /**
   * Uses the output from InputPasswordComponent to set a password
   * for a JIT provisioned user.
   */
  setPassword: (
    passwordInputResult: PasswordInputResult,
    orgSsoIdentifier: string,
    orgId: string,
    resetPasswordAutoEnroll: boolean,
    userId: UserId,
  ) => Promise<void>;
  /**
   * Runs client-specific code after the password has been successfully set.
   * This method is should be overridden in clients that need to run code
   * after the password has been set.
   * @see WebSetPasswordJitService
   * @see DesktopSetPasswordJitService
   */
  runClientSpecificLogicAfterSetPasswordSuccess: () => Promise<void> | null;
}

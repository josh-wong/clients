import { firstValueFrom } from "rxjs";

import { InternalUserDecryptionOptionsServiceAbstraction } from "@bitwarden/auth/common";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationUserService } from "@bitwarden/common/admin-console/abstractions/organization-user/organization-user.service";
import { OrganizationUserResetPasswordEnrollmentRequest } from "@bitwarden/common/admin-console/abstractions/organization-user/requests";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { KdfConfigService } from "@bitwarden/common/auth/abstractions/kdf-config.service";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/auth/abstractions/master-password.service.abstraction";
import { ForceSetPasswordReason } from "@bitwarden/common/auth/models/domain/force-set-password-reason";
import { PBKDF2KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { SetPasswordRequest } from "@bitwarden/common/auth/models/request/set-password.request";
import { KeysRequest } from "@bitwarden/common/models/request/keys.request";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { UserId } from "@bitwarden/common/types/guid";
import { MasterKey, UserKey } from "@bitwarden/common/types/key";

import {
  SetPasswordCredentials,
  SetPasswordJitService,
} from "./set-password-jit.service.abstraction";

export class DefaultSetPasswordJitService implements SetPasswordJitService {
  protected orgId: string;

  resetPasswordAutoEnroll: boolean;
  masterPasswordPolicyOptions: MasterPasswordPolicyOptions;

  constructor(
    protected apiService: ApiService,
    protected cryptoService: CryptoService,
    protected i18nService: I18nService,
    protected kdfConfigService: KdfConfigService,
    protected masterPasswordService: InternalMasterPasswordServiceAbstraction,
    protected organizationApiService: OrganizationApiServiceAbstraction,
    protected organizationUserService: OrganizationUserService,
    protected policyApiService: PolicyApiServiceAbstraction,
    protected userDecryptionOptionsService: InternalUserDecryptionOptionsServiceAbstraction,
  ) {}

  async resolveOrgAutoEnrollData(orgSsoIdentifier: string): Promise<void> {
    const autoEnrollStatus =
      await this.organizationApiService.getAutoEnrollStatus(orgSsoIdentifier);

    if (autoEnrollStatus == null) {
      throw new Error("autoEnrollStatus not found.");
    }

    this.orgId = autoEnrollStatus.id;
    this.resetPasswordAutoEnroll = autoEnrollStatus.resetPasswordEnabled;
    this.masterPasswordPolicyOptions =
      await this.policyApiService.getMasterPasswordPolicyOptsForOrgUser(autoEnrollStatus.id);
  }

  async setPassword(credentials: SetPasswordCredentials): Promise<void> {
    const {
      masterKey,
      masterKeyHash,
      localMasterKeyHash,
      hint,
      kdfConfig,
      orgSsoIdentifier,
      userId,
    } = credentials;

    for (const [key, value] of Object.entries(credentials)) {
      if (value == null) {
        throw new Error(`${key} not found. Could not set password.`);
      }
    }

    const protectedUserKey = await this.makeProtectedUserKey(masterKey, userId);
    if (protectedUserKey == null) {
      throw new Error("protectedUserKey not found. Could not set password.");
    }

    // Since this is an existing JIT provisioned user in a MP encryption org setting first password,
    // they will not already have a user asymmetric key pair so we must create it for them.
    const newKeyPair = await this.cryptoService.makeKeyPair(protectedUserKey[0]);
    if (newKeyPair == null) {
      throw new Error("newKeyPair not found. Could not set password.");
    }
    const keysRequest = new KeysRequest(newKeyPair[0], newKeyPair[1].encryptedString);

    const request = new SetPasswordRequest(
      masterKeyHash,
      protectedUserKey[1].encryptedString,
      hint,
      orgSsoIdentifier,
      keysRequest,
      kdfConfig.kdfType, // kdfConfig is always DEFAULT_KDF_CONFIG (see InputPasswordComponent)
      kdfConfig.iterations,
    );

    await this.apiService.setPassword(request);

    // Clear force set password reason to allow navigation back to vault.
    await this.masterPasswordService.setForceSetPasswordReason(ForceSetPasswordReason.None, userId);

    // User now has a password so update account decryption options in state
    await this.updateAccountDecryptionProperties(masterKey, kdfConfig, protectedUserKey, userId);

    await this.cryptoService.setPrivateKey(newKeyPair[1].encryptedString, userId);

    await this.masterPasswordService.setMasterKeyHash(localMasterKeyHash, userId);

    if (this.resetPasswordAutoEnroll) {
      await this.handleResetPasswordAutoEnroll(masterKeyHash, userId);
    }
  }

  clearOrgData() {
    this.orgId = null;
    this.resetPasswordAutoEnroll = null;
    this.masterPasswordPolicyOptions = null;
  }

  private async makeProtectedUserKey(
    masterKey: MasterKey,
    userId: UserId,
  ): Promise<[UserKey, EncString]> {
    let protectedUserKey: [UserKey, EncString] = null;

    const userKey = await firstValueFrom(this.cryptoService.userKey$(userId));

    if (userKey == null) {
      protectedUserKey = await this.cryptoService.makeUserKey(masterKey);
    } else {
      protectedUserKey = await this.cryptoService.encryptUserKeyWithMasterKey(masterKey);
    }

    return protectedUserKey;
  }

  private async updateAccountDecryptionProperties(
    masterKey: MasterKey,
    kdfConfig: PBKDF2KdfConfig,
    protectedUserKey: [UserKey, EncString],
    userId: UserId,
  ) {
    const userDecryptionOpts = await firstValueFrom(
      this.userDecryptionOptionsService.userDecryptionOptions$,
    );
    userDecryptionOpts.hasMasterPassword = true;
    await this.userDecryptionOptionsService.setUserDecryptionOptions(userDecryptionOpts);
    await this.kdfConfigService.setKdfConfig(userId, kdfConfig);
    await this.masterPasswordService.setMasterKey(masterKey, userId);
    await this.cryptoService.setUserKey(protectedUserKey[0], userId);
  }

  private async handleResetPasswordAutoEnroll(masterKeyHash: string, userId: UserId) {
    const organizationKeys = await this.organizationApiService.getKeys(this.orgId);

    if (organizationKeys == null) {
      throw new Error(this.i18nService.t("resetPasswordOrgKeysError"));
    }

    const publicKey = Utils.fromB64ToArray(organizationKeys.publicKey);

    // RSA Encrypt user key with organization public key
    const userKey = await firstValueFrom(this.cryptoService.userKey$(userId));

    if (userKey == null) {
      throw new Error("userKey not found. Could not handle reset password auto enroll.");
    }

    const encryptedUserKey = await this.cryptoService.rsaEncrypt(userKey.key, publicKey);

    const resetRequest = new OrganizationUserResetPasswordEnrollmentRequest();
    resetRequest.masterPasswordHash = masterKeyHash;
    resetRequest.resetPasswordKey = encryptedUserKey.encryptedString;

    await this.organizationUserService.putOrganizationUserResetPasswordEnrollment(
      this.orgId,
      userId,
      resetRequest,
    );
  }
}

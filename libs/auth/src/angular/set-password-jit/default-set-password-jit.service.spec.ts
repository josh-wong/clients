import { MockProxy, mock } from "jest-mock-extended";

import { InternalUserDecryptionOptionsServiceAbstraction } from "@bitwarden/auth/common";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationUserService } from "@bitwarden/common/admin-console/abstractions/organization-user/organization-user.service";
import { KdfConfigService } from "@bitwarden/common/auth/abstractions/kdf-config.service";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/auth/abstractions/master-password.service.abstraction";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { DefaultSetPasswordJitService } from "./default-set-password-jit.service";

describe("DefaultSetPasswordJitService", () => {
  let sut: DefaultSetPasswordJitService;

  let apiService: MockProxy<ApiService>;
  let cryptoService: MockProxy<CryptoService>;
  let i18nService: MockProxy<I18nService>;
  let kdfConfigService: MockProxy<KdfConfigService>;
  let masterPasswordService: MockProxy<InternalMasterPasswordServiceAbstraction>;
  let organizationApiService: MockProxy<OrganizationApiServiceAbstraction>;
  let organizationUserService: MockProxy<OrganizationUserService>;
  let userDecryptionOptionsService: MockProxy<InternalUserDecryptionOptionsServiceAbstraction>;

  beforeEach(() => {
    apiService = mock<ApiService>();
    cryptoService = mock<CryptoService>();
    i18nService = mock<I18nService>();
    kdfConfigService = mock<KdfConfigService>();
    masterPasswordService = mock<InternalMasterPasswordServiceAbstraction>();
    organizationApiService = mock<OrganizationApiServiceAbstraction>();
    organizationUserService = mock<OrganizationUserService>();
    userDecryptionOptionsService = mock<InternalUserDecryptionOptionsServiceAbstraction>();

    sut = new DefaultSetPasswordJitService(
      apiService,
      cryptoService,
      i18nService,
      kdfConfigService,
      masterPasswordService,
      organizationApiService,
      organizationUserService,
      userDecryptionOptionsService,
    );
  });

  it("should instantiate the DefaultSetPasswordJitService", () => {
    expect(sut).not.toBeFalsy();
  });

  describe("runClientSpecificLogicAfterSetPasswordSuccess", () => {
    it("should return null", async () => {
      const result = await sut.runClientSpecificLogicAfterSetPasswordSuccess();

      expect(result).toBeNull();
    });
  });

  describe("setPassword", () => {
    it("should set password successfully", async () => {});
  });
});

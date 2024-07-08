import { DIALOG_DATA, DialogConfig } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationUserService } from "@bitwarden/common/admin-console/abstractions/organization-user/organization-user.service";
import { OrganizationUserBulkConfirmRequest } from "@bitwarden/common/admin-console/abstractions/organization-user/requests";
import { OrganizationUserStatusType } from "@bitwarden/common/admin-console/enums";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { DialogService } from "@bitwarden/components";

import { BaseBulkConfirmComponent } from "./base.bulk-confirm.component";
import { BulkUserDetails } from "./bulk-status.component";

type BulkConfirmDialogData = {
  organizationId: string;
  users: BulkUserDetails[];
};

@Component({
  selector: "app-bulk-confirm",
  templateUrl: "bulk-confirm.component.html",
})
export class BulkConfirmComponent extends BaseBulkConfirmComponent {
  organizationId: string;
  users: BulkUserDetails[];

  constructor(
    @Inject(DIALOG_DATA) protected data: BulkConfirmDialogData,
    protected cryptoService: CryptoService,
    protected apiService: ApiService,
    private organizationUserService: OrganizationUserService,
    protected i18nService: I18nService,
  ) {
    super(cryptoService, i18nService);

    this.organizationId = data.organizationId;
    this.users = data.users;

    this.excludedUsers = this.users.filter((u) => !this.isAccepted(u));
    this.filteredUsers = this.users.filter((u) => this.isAccepted(u));

    if (this.filteredUsers.length <= 0) {
      this.done = true;
    }

    this.loading = false;
  }

  protected isAccepted(user: BulkUserDetails) {
    return user.status === OrganizationUserStatusType.Accepted;
  }

  protected async getPublicKeys() {
    return await this.organizationUserService.postOrganizationUsersPublicKey(
      this.organizationId,
      this.filteredUsers.map((user) => user.id),
    );
  }

  protected getCryptoKey(): Promise<SymmetricCryptoKey> {
    return this.cryptoService.getOrgKey(this.organizationId);
  }

  protected async postConfirmRequest(userIdsWithKeys: any[]) {
    const request = new OrganizationUserBulkConfirmRequest(userIdsWithKeys);
    return await this.organizationUserService.postOrganizationUserBulkConfirm(
      this.organizationId,
      request,
    );
  }

  static open(dialogService: DialogService, config: DialogConfig<BulkConfirmDialogData>) {
    return dialogService.open(BulkConfirmComponent, config);
  }
}

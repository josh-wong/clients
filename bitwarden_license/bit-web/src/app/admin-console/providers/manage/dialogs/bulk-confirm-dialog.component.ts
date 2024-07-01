import { DIALOG_DATA, DialogConfig } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { filter } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ProviderUserStatusType } from "@bitwarden/common/admin-console/enums";
import { ProviderUserBulkConfirmRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-bulk-confirm.request";
import { ProviderUserBulkRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-bulk.request";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { DialogService } from "@bitwarden/components";
import { BulkUserDetails } from "@bitwarden/web-vault/app/admin-console/organizations/members/components/bulk/bulk-status.component";

type BulkConfirmDialogParams = {
  providerId: string;
  users: BulkUserDetails[];
};

export const openBulkConfirmDialog = (
  dialogService: DialogService,
  dialogConfig: DialogConfig<BulkConfirmDialogParams>,
) => dialogService.open(BulkConfirmDialogComponent, dialogConfig);

@Component({
  templateUrl: "bulk-confirm-dialog.component.html",
})
export class BulkConfirmDialogComponent implements OnInit {
  providerId: string;
  users: BulkUserDetails[];

  excludedUsers: BulkUserDetails[];
  filteredUsers: BulkUserDetails[];
  publicKeys: Map<string, Uint8Array> = new Map();
  fingerprints: Map<string, string> = new Map();
  statuses: Map<string, string> = new Map();

  loading = true;
  done = false;
  error: string;

  constructor(
    private apiService: ApiService,
    private cryptoService: CryptoService,
    @Inject(DIALOG_DATA) protected dialogParams: BulkConfirmDialogParams,
    private i18nService: I18nService,
  ) {
    this.providerId = dialogParams.providerId;
    this.users = dialogParams.users;
  }

  async ngOnInit() {
    this.excludedUsers = this.users.filter(
      (user) => user.status !== ProviderUserStatusType.Accepted,
    );
    this.filteredUsers = this.users.filter(
      (user) => user.status === ProviderUserStatusType.Accepted,
    );

    if (this.filteredUsers.length <= 0) {
      this.done = true;
    }

    const request = new ProviderUserBulkRequest(this.filteredUsers.map((user) => user.id));
    const publicKeys = await this.apiService.postProviderUsersPublicKey(this.providerId, request);

    for (const entry of publicKeys.data) {
      const publicKey = Utils.fromB64ToArray(entry.key);
      const fingerprint = await this.cryptoService.getFingerprint(entry.userId, publicKey);
      if (fingerprint != null) {
        this.publicKeys.set(entry.id, publicKey);
        this.fingerprints.set(entry.id, fingerprint.join("-"));
      }
    }

    this.loading = false;
  }

  submit = async () => {
    this.loading = true;
    try {
      const providerKey = await this.cryptoService.getProviderKey(this.providerId);

      const userIdsWithKeys: any[] = [];
      for (const user of this.filteredUsers) {
        const publicKey = this.publicKeys.get(user.id);
        if (publicKey == null) {
          continue;
        }
        const encryptedKey = await this.cryptoService.rsaEncrypt(providerKey.key, publicKey);
        userIdsWithKeys.push({
          id: user.id,
          key: encryptedKey.encryptedString,
        });
      }

      const request = new ProviderUserBulkConfirmRequest(userIdsWithKeys);
      const response = await this.apiService.postProviderUserBulkConfirm(this.providerId, request);

      response.data.forEach((entry) => {
        const error = entry.error !== "" ? entry.error : this.i18nService.t("bulkConfirmMessage");
        this.statuses.set(entry.id, error);
      });

      this.done = true;
    } catch (e) {
      this.error = e.message;
    }
    this.loading = false;
  };
  protected readonly filter = filter;
}

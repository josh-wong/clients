import { DIALOG_DATA, DialogConfig } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ProviderUserStatusType } from "@bitwarden/common/admin-console/enums";
import { ProviderUserBulkRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-bulk.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { DialogService } from "@bitwarden/components";
import { BulkUserDetails } from "@bitwarden/web-vault/app/admin-console/organizations/members/components/bulk/bulk-status.component";

type BulkRemoveDialogParams = {
  providerId: string;
  users: BulkUserDetails[];
};

export const openBulkRemoveDialog = (
  dialogService: DialogService,
  dialogConfig: DialogConfig<BulkRemoveDialogParams>,
) => dialogService.open(BulkRemoveDialogComponent, dialogConfig);

@Component({
  templateUrl: "bulk-remove-dialog.component.html",
})
export class BulkRemoveDialogComponent {
  providerId: string;
  users: BulkUserDetails[];

  statuses: Map<string, string> = new Map();

  loading = false;
  done = false;
  error: string;
  showNoMasterPasswordWarning = false;

  constructor(
    private apiService: ApiService,
    @Inject(DIALOG_DATA) dialogParams: BulkRemoveDialogParams,
    private i18nService: I18nService,
  ) {
    this.providerId = dialogParams.providerId;
    this.users = dialogParams.users;
    this.showNoMasterPasswordWarning = this.users.some(
      (u) => u.status > ProviderUserStatusType.Invited && u.hasMasterPassword === false,
    );
  }

  submit = async () => {
    this.loading = true;
    try {
      const request = new ProviderUserBulkRequest(this.users.map((user) => user.id));
      const response = await this.apiService.deleteManyProviderUsers(this.providerId, request);

      response.data.forEach((entry) => {
        const error = entry.error !== "" ? entry.error : this.i18nService.t("bulkRemovedMessage");
        this.statuses.set(entry.id, error);
      });

      this.done = true;
    } catch (e) {
      this.error = e.message;
    }

    this.loading = false;
  };

  protected get removeUsersWarning() {
    return this.i18nService.t("removeOrgUsersConfirmation");
  }
}

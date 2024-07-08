import { DIALOG_DATA, DialogConfig } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationUserService } from "@bitwarden/common/admin-console/abstractions/organization-user/organization-user.service";
import { OrganizationUserStatusType } from "@bitwarden/common/admin-console/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { DialogService } from "@bitwarden/components";

import { BaseBulkRemoveComponent } from "./base.bulk-remove.component";
import { BulkUserDetails } from "./bulk-status.component";

type BulkRemoveDialogData = {
  organizationId: string;
  users: BulkUserDetails[];
};

@Component({
  selector: "app-bulk-remove",
  templateUrl: "bulk-remove.component.html",
})
export class BulkRemoveComponent extends BaseBulkRemoveComponent {
  organizationId: string;
  users: BulkUserDetails[];

  constructor(
    @Inject(DIALOG_DATA) protected data: BulkRemoveDialogData,
    protected apiService: ApiService,
    protected i18nService: I18nService,
    private organizationUserService: OrganizationUserService,
  ) {
    super(i18nService);

    this.organizationId = data.organizationId;
    this.users = data.users;
    this.showNoMasterPasswordWarning = this.users.some(
      (u) => u.status > OrganizationUserStatusType.Invited && u.hasMasterPassword === false,
    );
  }

  protected async deleteUsers() {
    return await this.organizationUserService.deleteManyOrganizationUsers(
      this.organizationId,
      this.users.map((user) => user.id),
    );
  }

  protected get removeUsersWarning() {
    return this.i18nService.t("removeOrgUsersConfirmation");
  }

  static open(dialogService: DialogService, config: DialogConfig<BulkRemoveDialogData>) {
    return dialogService.open(BulkRemoveComponent, config);
  }
}

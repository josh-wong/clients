import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ProviderUserType } from "@bitwarden/common/admin-console/enums";
import { ProviderUserInviteRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-invite.request";
import { ProviderUserUpdateRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-update.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { DialogService, ToastService } from "@bitwarden/components";

export type MembersDialogParams = {
  providerId: string;
  user?: {
    id: string;
    name: string;
    type: ProviderUserType;
  };
};

export enum MembersDialogResultType {
  Closed = "closed",
  Deleted = "deleted",
  Saved = "saved",
}

export const openMembersDialog = (
  dialogService: DialogService,
  dialogConfig: DialogConfig<MembersDialogParams>,
) =>
  dialogService.open<MembersDialogResultType, MembersDialogParams>(
    MembersDialogComponent,
    dialogConfig,
  );

@Component({
  templateUrl: "members-dialog.component.html",
})
export class MembersDialogComponent implements OnInit {
  editing = false;
  loading = true;
  title: string;

  protected ResultType = MembersDialogResultType;
  protected UserType = ProviderUserType;

  protected formGroup = new FormGroup({
    emails: new FormControl<string>("", [Validators.required]),
    type: new FormControl(this.dialogParams.user?.type ?? ProviderUserType.ServiceUser),
  });

  constructor(
    private apiService: ApiService,
    @Inject(DIALOG_DATA) protected dialogParams: MembersDialogParams,
    private dialogRef: DialogRef<MembersDialogResultType>,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private logService: LogService,
    private toastService: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.editing = this.loading = this.dialogParams.user != null;
    if (this.editing) {
      this.title = this.i18nService.t("editMember");
      const emailControl = this.formGroup.controls.emails;
      emailControl.removeValidators(Validators.required);
      emailControl.disable();
    } else {
      this.title = this.i18nService.t("inviteMember");
    }

    this.loading = false;
  }

  delete = async (): Promise<void> => {
    if (!this.editing) {
      return;
    }

    const confirmed = await this.dialogService.openSimpleDialog({
      title: this.dialogParams.user.name,
      content: { key: "removeUserConfirmation" },
      type: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      await this.apiService.deleteProviderUser(
        this.dialogParams.providerId,
        this.dialogParams.user.id,
      );
      this.toastService.showToast({
        variant: "success",
        title: null,
        message: this.i18nService.t("removedUserId", this.dialogParams.user.name),
      });

      this.dialogRef.close(MembersDialogResultType.Deleted);
    } catch (error) {
      this.logService.error(error);
    }
  };

  submit = async (): Promise<void> => {
    try {
      if (this.editing) {
        const request = new ProviderUserUpdateRequest();
        request.type = this.formGroup.value.type;
        await this.apiService.putProviderUser(
          this.dialogParams.providerId,
          this.dialogParams.user.id,
          request,
        );
      } else {
        const request = new ProviderUserInviteRequest();
        request.emails = this.formGroup.value.emails.trim().split(/\s*,\s*/);
        request.type = this.formGroup.value.type;
        await this.apiService.postProviderUserInvite(this.dialogParams.providerId, request);
      }

      this.toastService.showToast({
        variant: "success",
        title: null,
        message: this.i18nService.t(
          this.editing ? "editedUserId" : "invitedUsers",
          this.dialogParams.user?.name,
        ),
      });

      this.dialogRef.close(MembersDialogResultType.Saved);
    } catch (error) {
      this.logService.error(error);
    }
  };
}

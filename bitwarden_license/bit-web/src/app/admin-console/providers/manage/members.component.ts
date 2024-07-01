import { DialogRef } from "@angular/cdk/dialog";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { combineLatest, lastValueFrom, Subject, switchMap, takeUntil } from "rxjs";
import { first } from "rxjs/operators";

import { UserNamePipe } from "@bitwarden/angular/pipes/user-name.pipe";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationManagementPreferencesService } from "@bitwarden/common/admin-console/abstractions/organization-management-preferences/organization-management-preferences.service";
import { ProviderService } from "@bitwarden/common/admin-console/abstractions/provider.service";
import {
  OrganizationUserStatusType,
  ProviderUserStatusType,
  ProviderUserType,
} from "@bitwarden/common/admin-console/enums";
import { ProviderUserBulkRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-bulk.request";
import { ProviderUserConfirmRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-confirm.request";
import { ProviderUserUserDetailsResponse } from "@bitwarden/common/admin-console/models/response/provider/provider-user.response";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ListResponse } from "@bitwarden/common/models/response/list.response";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";
import { DialogService, ToastService } from "@bitwarden/components";
import { NewBasePeopleComponent } from "@bitwarden/web-vault/app/admin-console/common/new-base.people.component";
import { PeopleTableDataSource } from "@bitwarden/web-vault/app/admin-console/common/people-table-data-source";
import { openEntityEventsDialog } from "@bitwarden/web-vault/app/admin-console/organizations/manage/entity-events.component";
import { BulkStatusComponent } from "@bitwarden/web-vault/app/admin-console/organizations/members/components/bulk/bulk-status.component";

import { openBulkConfirmDialog } from "./dialogs/bulk-confirm-dialog.component";
import { openBulkRemoveDialog } from "./dialogs/bulk-remove-dialog.component";
import {
  MembersDialogParams,
  MembersDialogResultType,
  openMembersDialog,
} from "./dialogs/members-dialog.component";

type ProviderUser = ProviderUserUserDetailsResponse;

class MembersTableDataSource extends PeopleTableDataSource<ProviderUser> {
  protected statusType = OrganizationUserStatusType;
}

@Component({
  templateUrl: "members.component.html",
})
export class MembersComponent
  extends NewBasePeopleComponent<ProviderUser>
  implements OnInit, OnDestroy
{
  accessEvents = false;
  dataSource = new MembersTableDataSource();
  loading = true;
  providerId: string;
  rowHeight = 62;
  status: ProviderUserStatusType = null;

  userStatusType = ProviderUserStatusType;
  userType = ProviderUserType;

  private destroy$ = new Subject<void>();

  constructor(
    apiService: ApiService,
    cryptoService: CryptoService,
    dialogService: DialogService,
    i18nService: I18nService,
    logService: LogService,
    organizationManagementPreferencesService: OrganizationManagementPreferencesService,
    toastService: ToastService,
    userNamePipe: UserNamePipe,
    validationService: ValidationService,
    private activatedRoute: ActivatedRoute,
    private configService: ConfigService,
    private providerService: ProviderService,
    private router: Router,
  ) {
    super(
      apiService,
      i18nService,
      cryptoService,
      validationService,
      logService,
      userNamePipe,
      dialogService,
      organizationManagementPreferencesService,
      toastService,
    );
  }

  ngOnInit(): void {
    const useProviderPortalMembersPage$ = this.configService.getFeatureFlag$(
      FeatureFlag.AC2828_ProviderPortalMembersPage,
    );

    const queryParams$ = this.activatedRoute.queryParams.pipe(first());

    combineLatest([useProviderPortalMembersPage$, this.activatedRoute.parent.params, queryParams$])
      .pipe(
        switchMap(async ([useProviderPortalMembersPage, urlParams, queryParams]) => {
          if (!useProviderPortalMembersPage) {
            return await this.router.navigate(["../people"], {
              relativeTo: this.activatedRoute,
              queryParams,
            });
          }

          this.searchControl.setValue(queryParams.search);

          this.providerId = urlParams.providerId;
          const provider = await this.providerService.get(this.providerId);
          if (!provider || !provider.canManageUsers) {
            return await this.router.navigate(["../"], { relativeTo: this.activatedRoute });
          }
          this.accessEvents = provider.useEvents;
          await this.load();

          if (queryParams.viewEvents != null) {
            const user = this.dataSource.data.find((user) => user.id === queryParams.viewEvents);
            if (user && user.status === ProviderUserStatusType.Confirmed) {
              this.events(user);
            }
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async bulkConfirm(): Promise<void> {
    if (this.actionPromise != null) {
      return;
    }

    const dialogRef = openBulkConfirmDialog(this.dialogService, {
      data: {
        providerId: this.providerId,
        users: this.dataSource.getCheckedUsers(),
      },
    });

    await lastValueFrom(dialogRef.closed);
    await this.load();
  }

  async bulkReinvite(): Promise<void> {
    if (this.actionPromise != null) {
      return;
    }

    const checkedUsers = this.dataSource.getCheckedUsers();
    const checkedInvitedUsers = checkedUsers.filter(
      (user) => user.status === ProviderUserStatusType.Invited,
    );

    if (checkedInvitedUsers.length <= 0) {
      this.toastService.showToast({
        variant: "error",
        title: this.i18nService.t("errorOccurred"),
        message: this.i18nService.t("noSelectedUsersApplicable"),
      });
      return;
    }

    try {
      const request = this.apiService.postManyProviderUserReinvite(
        this.providerId,
        new ProviderUserBulkRequest(checkedInvitedUsers.map((user) => user.id)),
      );

      const dialogRef = BulkStatusComponent.open(this.dialogService, {
        data: {
          users: checkedUsers,
          filteredUsers: checkedInvitedUsers,
          request,
          successfulMessage: this.i18nService.t("bulkReinviteMessage"),
        },
      });
      await lastValueFrom(dialogRef.closed);
    } catch (error) {
      this.validationService.showError(error);
    }
  }

  async bulkRemove(): Promise<void> {
    if (this.actionPromise != null) {
      return;
    }

    const dialogRef = openBulkRemoveDialog(this.dialogService, {
      data: {
        providerId: this.providerId,
        users: this.dataSource.getCheckedUsers(),
      },
    });

    await lastValueFrom(dialogRef.closed);
    await this.load();
  }

  async confirmUser(user: ProviderUser, publicKey: Uint8Array): Promise<void> {
    const providerKey = await this.cryptoService.getProviderKey(this.providerId);
    const key = await this.cryptoService.rsaEncrypt(providerKey.key, publicKey);
    const request = new ProviderUserConfirmRequest();
    request.key = key.encryptedString;
    await this.apiService.postProviderUserConfirm(this.providerId, user.id, request);
  }

  deleteUser = (id: string) => this.apiService.deleteProviderUser(this.providerId, id);

  edit = async (user: ProviderUser | null) => {
    const data: MembersDialogParams = {
      providerId: this.providerId,
    };

    if (user != null) {
      data.user = {
        id: user.id,
        name: this.userNamePipe.transform(user),
        type: user.type,
      };
    }

    const dialogRef = openMembersDialog(this.dialogService, {
      data,
    });

    const result = await lastValueFrom(dialogRef.closed);

    switch (result) {
      case MembersDialogResultType.Saved:
      case MembersDialogResultType.Deleted:
        await this.load();
        break;
    }
  };

  events = (user: ProviderUser): DialogRef<void> =>
    openEntityEventsDialog(this.dialogService, {
      data: {
        name: this.userNamePipe.transform(user),
        providerId: this.providerId,
        entityId: user.id,
        showUser: false,
        entity: "user",
      },
    });

  getUsers = (): Promise<ProviderUser[] | ListResponse<ProviderUser>> =>
    this.apiService.getProviderUsers(this.providerId);

  reinviteUser = (id: string): Promise<void> =>
    this.apiService.postProviderUserReinvite(this.providerId, id);
}

import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom, map } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

import { ToastService } from "../../../../components/src/toast";
import { InputPasswordComponent } from "../input-password/input-password.component";
import { PasswordInputResult } from "../input-password/password-input-result";

import {
  SetPasswordCredentials,
  SetPasswordJitService,
} from "./set-password-jit.service.abstraction";

@Component({
  standalone: true,
  selector: "auth-set-password-jit",
  templateUrl: "set-password-jit.component.html",
  imports: [CommonModule, InputPasswordComponent, JslibModule],
})
export class SetPasswordJitComponent implements OnInit, OnDestroy {
  protected email: string;
  protected orgSsoIdentifier: string;
  protected submitting = false;
  protected syncLoading = true;

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private router: Router,
    private setPasswordJitService: SetPasswordJitService,
    private syncService: SyncService,
    private toastService: ToastService,
    private validationService: ValidationService,
  ) {}

  get resetPasswordAutoEnroll() {
    return this.setPasswordJitService.resetPasswordAutoEnroll;
  }

  get masterPasswordPolicyOptions() {
    return this.setPasswordJitService.masterPasswordPolicyOptions;
  }

  async ngOnInit() {
    this.email = await firstValueFrom(
      this.accountService.activeAccount$.pipe(map((a) => a?.email)),
    );

    await this.syncService.fullSync(true);
    this.syncLoading = false;

    const qParams = await firstValueFrom(this.activatedRoute.queryParams);
    if (qParams.identifier != null) {
      try {
        this.orgSsoIdentifier = qParams.identifier;
        await this.setPasswordJitService.resolveOrgAutoEnrollData(this.orgSsoIdentifier);
      } catch {
        this.toastService.showToast({
          variant: "error",
          title: null,
          message: this.i18nService.t("errorOccurred"),
        });
      }
    }
  }

  ngOnDestroy() {
    this.setPasswordJitService.clearOrgData();
  }

  protected async handlePasswordFormSubmit(passwordInputResult: PasswordInputResult) {
    this.submitting = true;

    const userId = (await firstValueFrom(this.accountService.activeAccount$))?.id;

    const credentials: SetPasswordCredentials = {
      ...passwordInputResult,
      orgSsoIdentifier: this.orgSsoIdentifier,
      userId,
    };

    try {
      await this.setPasswordJitService.setPassword(credentials);
    } catch (e) {
      this.validationService.showError(e);
      this.submitting = false;
      return;
    }

    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("accountSuccessfullyCreated"),
    });

    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("inviteAccepted"),
    });

    this.submitting = false;

    await this.router.navigate(["vault"]);
  }
}

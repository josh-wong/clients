import { inject } from "@angular/core";

import { DefaultSetPasswordJitService, SetPasswordJitService } from "@bitwarden/auth/angular";

import { RouterService } from "../../../../core/router.service";
import { AcceptOrganizationInviteService } from "../../../organization-invite/accept-organization.service";

export class WebSetPasswordJitService
  extends DefaultSetPasswordJitService
  implements SetPasswordJitService
{
  routerService = inject(RouterService);
  acceptOrganizationInviteService = inject(AcceptOrganizationInviteService);

  override async runClientSpecificLogicAfterSetPasswordSuccess(): Promise<void> {
    // SSO JIT accepts org invites when setting their MP, meaning
    // we can clear the deep linked url for accepting it.
    await this.routerService.getAndClearLoginRedirectUrl();
    await this.acceptOrganizationInviteService.clearOrganizationInvitation();
  }
}

import { inject } from "@angular/core";

import { DefaultSetPasswordJitService, SetPasswordJitService } from "@bitwarden/auth/angular";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";

export class DesktopSetPasswordJitService
  extends DefaultSetPasswordJitService
  implements SetPasswordJitService
{
  messagingService = inject(MessagingService);

  override async runClientSpecificLogicAfterSetPasswordSuccess(): Promise<void> {
    this.messagingService.send("redrawMenu");
  }
}

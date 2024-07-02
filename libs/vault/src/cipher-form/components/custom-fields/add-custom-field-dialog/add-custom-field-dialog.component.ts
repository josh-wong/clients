import { Component } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ButtonModule, DialogModule } from "@bitwarden/components";

@Component({
  standalone: true,
  selector: "vault-add-custom-field-dialog",
  templateUrl: "./add-custom-field-dialog.component.html",
  imports: [JslibModule, DialogModule, ButtonModule],
})
export class AddCustomFieldDialogComponent {}

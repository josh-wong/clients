import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { DialogService } from "@bitwarden/components";

import { AddCustomFieldDialogComponent } from "./add-custom-field-dialog/add-custom-field-dialog.component";

@Component({
  standalone: true,
  selector: "vault-custom-fields",
  templateUrl: "./custom-fields.component.html",
  imports: [JslibModule, CommonModule],
})
export class CustomFieldsComponent {
  constructor(private dialogService: DialogService) {}

  /** Opens add custom field dialog */
  openAddCustomFieldDialog() {
    this.dialogService.open(AddCustomFieldDialogComponent);
  }
}

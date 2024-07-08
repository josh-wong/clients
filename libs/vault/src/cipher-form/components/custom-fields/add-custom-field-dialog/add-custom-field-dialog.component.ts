import { DIALOG_DATA } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { FieldType } from "@bitwarden/common/vault/enums";
import { ButtonModule, DialogModule, FormFieldModule, SelectModule } from "@bitwarden/components";

export type AddCustomFieldDialogData = {
  addField: (type: FieldType, label: string) => void;
};

@Component({
  standalone: true,
  selector: "vault-add-custom-field-dialog",
  templateUrl: "./add-custom-field-dialog.component.html",
  imports: [
    CommonModule,
    JslibModule,
    DialogModule,
    ButtonModule,
    FormFieldModule,
    SelectModule,
    ReactiveFormsModule,
  ],
})
export class AddCustomFieldDialogComponent {
  customFieldForm = this.formBuilder.group({
    type: FieldType.Text,
    label: [""],
  });

  fieldTypeOptions = [
    { name: this.i18nService.t("cfTypeText"), value: FieldType.Text },
    { name: this.i18nService.t("cfTypeHidden"), value: FieldType.Hidden },
    { name: this.i18nService.t("cfTypeBoolean"), value: FieldType.Boolean },
    { name: this.i18nService.t("cfTypeLinked"), value: FieldType.Linked },
  ];

  FieldType = FieldType;

  constructor(
    @Inject(DIALOG_DATA) private data: AddCustomFieldDialogData,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
  ) {}

  getTypeHint(): string {
    switch (this.customFieldForm.get("type")?.value) {
      case FieldType.Text:
        return this.i18nService.t("textHelpText");
      case FieldType.Hidden:
        return this.i18nService.t("hiddenHelpText");
      case FieldType.Boolean:
        return this.i18nService.t("checkBoxHelpText");
      case FieldType.Linked:
        return this.i18nService.t("linkedHelpText");
      default:
        return "";
    }
  }

  /** Invoke the `addField` callback with the custom field details */
  addField() {
    const { type, label } = this.customFieldForm.value;
    this.data.addField(type, label);
  }
}

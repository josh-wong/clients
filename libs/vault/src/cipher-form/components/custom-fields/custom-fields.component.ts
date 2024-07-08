import { DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { FieldType, LinkedIdType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { FieldView } from "@bitwarden/common/vault/models/view/field.view";
import {
  DialogService,
  SectionComponent,
  SectionHeaderComponent,
  FormFieldModule,
  TypographyModule,
  CardComponent,
  IconButtonModule,
  CheckboxModule,
  SelectModule,
} from "@bitwarden/components";

import { CipherFormContainer } from "../../cipher-form-container";

import { AddCustomFieldDialogComponent } from "./add-custom-field-dialog/add-custom-field-dialog.component";

@Component({
  standalone: true,
  selector: "vault-custom-fields",
  templateUrl: "./custom-fields.component.html",
  imports: [
    JslibModule,
    CommonModule,
    FormsModule,
    FormFieldModule,
    ReactiveFormsModule,
    SectionComponent,
    SectionHeaderComponent,
    TypographyModule,
    CardComponent,
    IconButtonModule,
    CheckboxModule,
    SelectModule,
  ],
})
export class CustomFieldsComponent implements OnInit {
  /** Cipher view that is updated with the user's edits */
  @Input() updatedCipherView: CipherView | null = null;

  customFieldsForm = this.formBuilder.group({
    fields: new FormArray([]),
  });

  /** Reference to the add field dialog */
  dialogRef: DialogRef;

  /** Options for Linked Fields */
  linkedFieldOptions: { name: string; value: LinkedIdType }[] = [];

  FieldType = FieldType;

  constructor(
    private dialogService: DialogService,
    private cipherFormContainer: CipherFormContainer,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
  ) {
    this.cipherFormContainer.registerChildForm("customFields", this.customFieldsForm);

    this.customFieldsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((values) => {
      const fields = values.fields.map(
        (field: {
          type: FieldType;
          name: string;
          value: string | null;
          linkedId: LinkedIdType;
        }) => {
          // Use string literal to turn a number into a string, no impact to other strings
          const value = typeof field.value === "number" ? `${field.value}` : field.value;

          const fieldView = new FieldView();
          fieldView.type = field.type;
          fieldView.name = field.name;
          fieldView.value = value;
          fieldView.linkedId = field.linkedId;
          return fieldView;
        },
      );

      this.cipherFormContainer.patchCipher({
        fields,
      });
    });
  }

  /** Fields form array, referenced via a getter to avoid type-casting in multiple places  */
  get fields(): FormArray {
    return this.customFieldsForm.controls.fields as FormArray;
  }

  ngOnInit() {
    this.linkedFieldOptions = Array.from(this.updatedCipherView.linkedFieldOptions.entries() ?? [])
      .map(([id, linkedFieldOption]) => ({
        name: this.i18nService.t(linkedFieldOption.i18nKey),
        value: id,
      }))
      .sort(Utils.getSortFunction(this.i18nService, "name"));

    this.updatedCipherView.fields?.forEach((field) => {
      const value = field.type === FieldType.Boolean ? field.value === "true" : field.value;

      this.fields.push(
        this.formBuilder.group({
          type: field.type,
          name: field.name,
          value,
          linkedId: field.linkedId,
        }),
      );
    });
  }

  /** Opens add custom field dialog */
  openAddCustomFieldDialog() {
    this.dialogRef = this.dialogService.open(AddCustomFieldDialogComponent, {
      data: {
        addField: this.addField.bind(this),
      },
    });
  }

  /** Adds a new field to the form */
  addField(type: FieldType, label: string) {
    this.dialogRef.close();

    let value = null;
    let linkedId = null;

    if (type === FieldType.Boolean) {
      // Default to false for boolean fields
      value = "false";
    }

    if (type === FieldType.Linked && this.linkedFieldOptions.length > 0) {
      // Default to the first linked field option
      linkedId = this.linkedFieldOptions[0].value;
    }

    this.fields.push(
      this.formBuilder.group({
        type,
        name: label,
        value,
        linkedId,
      }),
    );
  }
}

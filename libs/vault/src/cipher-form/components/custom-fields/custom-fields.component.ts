import { DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { FieldType } from "@bitwarden/common/vault/enums";
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
  ],
})
export class CustomFieldsComponent implements OnInit {
  /** Initial custom fields associated with the cipher */
  @Input() initialFields: FieldView[] = [];

  customFieldsForm = this.formBuilder.group({
    fields: new FormArray([]),
  });

  /** Reference to the add field dialog */
  dialogRef: DialogRef;

  FieldType = FieldType;

  constructor(
    private dialogService: DialogService,
    private cipherFormContainer: CipherFormContainer,
    private formBuilder: FormBuilder,
  ) {
    this.cipherFormContainer.registerChildForm("customFields", this.customFieldsForm);

    this.customFieldsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((values) => {
      const fields = values.fields.map((field: { type: FieldType; name: string; value: any }) => {
        const fieldView = new FieldView();
        fieldView.type = field.type;
        fieldView.name = field.name;
        fieldView.value = `${field.value}`; // Use string literal to turn a boolean into a string, no impact to other strings
        return fieldView;
      });

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
    this.initialFields?.forEach((field) => {
      const value = field.type === FieldType.Boolean ? field.value === "true" : field.value;

      this.fields.push(
        this.formBuilder.group({
          type: field.type,
          name: field.name,
          value,
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

    const value = type === FieldType.Boolean ? false : null;

    this.fields.push(
      this.formBuilder.group({
        type,
        name: label,
        value,
      }),
    );
  }
}

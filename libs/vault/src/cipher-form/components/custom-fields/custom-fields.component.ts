import { LiveAnnouncer } from "@angular/cdk/a11y";
import { DialogRef } from "@angular/cdk/dialog";
import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Subject, switchMap, take } from "rxjs";

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

import {
  AddEditCustomFieldDialogComponent,
  AddEditCustomFieldDialogData,
} from "./add-edit-custom-field-dialog/add-edit-custom-field-dialog.component";

/** Attributes associated with each individual FormGroup within the FormArray */
type CustomField = {
  type: FieldType;
  name: string;
  value: string | boolean | null;
  linkedId: LinkedIdType;
};

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
    DragDropModule,
  ],
})
export class CustomFieldsComponent implements OnInit, AfterViewInit {
  @ViewChildren("customFieldRow") customFieldRows: QueryList<ElementRef<HTMLDivElement>>;

  /** Cipher view that is updated with the user's edits */
  @Input() updatedCipherView: CipherView | null = null;

  customFieldsForm = this.formBuilder.group({
    fields: new FormArray([]),
  });

  /** Reference to the add field dialog */
  dialogRef: DialogRef;

  /** Options for Linked Fields */
  linkedFieldOptions: { name: string; value: LinkedIdType }[] = [];

  /** Emits when a new custom field should be focused */
  private focusOnNewInput$ = new Subject<void>();

  destroyed$: DestroyRef;
  FieldType = FieldType;

  constructor(
    private dialogService: DialogService,
    private cipherFormContainer: CipherFormContainer,
    private formBuilder: FormBuilder,
    private i18nService: I18nService,
    private liveAnnouncer: LiveAnnouncer,
  ) {
    this.destroyed$ = inject(DestroyRef);
    this.cipherFormContainer.registerChildForm("customFields", this.customFieldsForm);

    this.customFieldsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((values) => {
      this.updateCipher(values.fields);
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
      let value: string | boolean = field.value;

      if (field.type === FieldType.Boolean) {
        value = field.value === "true" ? true : false;
      }

      this.fields.push(
        this.formBuilder.group<CustomField>({
          type: field.type,
          name: field.name,
          value: value,
          linkedId: field.linkedId,
        }),
      );
    });
  }

  ngAfterViewInit(): void {
    // Focus on the new input field when it is added
    // This is done after the view is initialized to ensure the input is rendered
    this.focusOnNewInput$
      .pipe(
        takeUntilDestroyed(this.destroyed$),
        // QueryList changes are emitted after the view is updated
        switchMap(() => this.customFieldRows.changes.pipe(take(1))),
      )
      .subscribe(() => {
        const input =
          this.customFieldRows.last.nativeElement.querySelector<HTMLInputElement>("input");
        const label = document.querySelector(`label[for="${input.id}"]`).textContent.trim();

        // Focus the input after the announcement element is added to the DOM,
        // this should stop the announcement from being cut off by the "focus" event.
        void this.liveAnnouncer
          .announce(this.i18nService.t("fieldAdded", label), "polite")
          .then(() => {
            input.focus();
          });
      });
  }

  /** Opens the add/edit custom field dialog */
  openAddEditCustomFieldDialog(editLabelConfig?: AddEditCustomFieldDialogData["editLabelConfig"]) {
    this.dialogRef = this.dialogService.open<unknown, AddEditCustomFieldDialogData>(
      AddEditCustomFieldDialogComponent,
      {
        data: {
          addField: this.addField.bind(this),
          updateLabel: this.updateLabel.bind(this),
          removeField: this.removeField.bind(this),
          editLabelConfig,
        },
      },
    );
  }

  /** Updates label for an individual field */
  updateLabel(index: number, label: string) {
    this.fields.at(index).patchValue({ name: label });
    this.dialogRef.close();
  }

  /** Removes an individual field at a specific index */
  removeField(index: number) {
    this.fields.removeAt(index);
    this.dialogRef.close();
  }

  /** Adds a new field to the form */
  addField(type: FieldType, label: string) {
    this.dialogRef.close();

    let value = null;
    let linkedId = null;

    if (type === FieldType.Boolean) {
      // Default to false for boolean fields
      value = false;
    }

    if (type === FieldType.Linked && this.linkedFieldOptions.length > 0) {
      // Default to the first linked field option
      linkedId = this.linkedFieldOptions[0].value;
    }

    this.fields.push(
      this.formBuilder.group<CustomField>({
        type,
        name: label,
        value,
        linkedId,
      }),
    );

    // Trigger focus on the new input field
    this.focusOnNewInput$.next();
  }

  /** Reorder the controls to match the new order after a "drop" event */
  drop(event: CdkDragDrop<HTMLDivElement>) {
    // Alter the order of the fields array in place
    moveItemInArray(this.fields.controls, event.previousIndex, event.currentIndex);

    this.updateCipher(this.fields.controls.map((control) => control.value));
  }

  /** Move a custom field up or down in the list order */
  async handleKeyDown(event: KeyboardEvent, label: string, index: number) {
    if (event.key === "ArrowUp" && index !== 0) {
      event.preventDefault();

      const currentIndex = index - 1;
      this.drop({ previousIndex: index, currentIndex } as CdkDragDrop<HTMLDivElement>);
      await this.liveAnnouncer.announce(
        this.i18nService.t("reorderFieldUp", label, currentIndex + 1, this.fields.length),
        "assertive",
      );

      // Refocus the button after the reorder
      // Angular re-renders the list when moving an item up which causes the focus to be lost
      // Wait for the next tick to ensure the button is rendered before focusing
      setTimeout(() => {
        (event.target as HTMLButtonElement).focus();
      });
    }

    if (event.key === "ArrowDown" && index !== this.fields.length - 1) {
      event.preventDefault();

      const currentIndex = index + 1;
      this.drop({ previousIndex: index, currentIndex } as CdkDragDrop<HTMLDivElement>);
      await this.liveAnnouncer.announce(
        this.i18nService.t("reorderFieldDown", label, currentIndex + 1, this.fields.length),
        "assertive",
      );
    }
  }

  /** Create `FieldView` from the form objects and update the cipher */
  private updateCipher(fields: CustomField[]) {
    const newFields = fields.map((field: CustomField) => {
      let value: string;

      if (typeof field.value === "number") {
        value = `${field.value}`;
      } else if (typeof field.value === "boolean") {
        value = field.value ? "true" : "false";
      } else {
        value = field.value;
      }

      const fieldView = new FieldView();
      fieldView.type = field.type;
      fieldView.name = field.name;
      fieldView.value = value;
      fieldView.linkedId = field.linkedId;
      return fieldView;
    });

    this.cipherFormContainer.patchCipher({
      fields: newFields,
    });
  }
}

import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { shareReplay } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CipherRepromptType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  CardComponent,
  CheckboxModule,
  FormFieldModule,
  SectionComponent,
  SectionHeaderComponent,
  TypographyModule,
} from "@bitwarden/components";

import { PasswordRepromptService } from "../../../services/password-reprompt.service";
import { CipherFormContainer } from "../../cipher-form-container";
import { CustomFieldsComponent } from "../custom-fields/custom-fields.component";

@Component({
  selector: "vault-additional-options-section",
  templateUrl: "./additional-options-section.component.html",
  standalone: true,
  imports: [
    CommonModule,
    SectionComponent,
    SectionHeaderComponent,
    TypographyModule,
    JslibModule,
    CardComponent,
    FormFieldModule,
    ReactiveFormsModule,
    CheckboxModule,
    CommonModule,
    CustomFieldsComponent,
  ],
})
export class AdditionalOptionsSectionComponent implements OnInit {
  @Input({ required: true }) updatedCipherView: CipherView | null = null;

  additionalOptionsForm = this.formBuilder.group({
    notes: [null as string],
    reprompt: [false],
  });

  passwordRepromptEnabled$ = this.passwordRepromptService.enabled$.pipe(
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  hasCustomFields = false;

  constructor(
    private cipherFormContainer: CipherFormContainer,
    private formBuilder: FormBuilder,
    private passwordRepromptService: PasswordRepromptService,
  ) {
    this.cipherFormContainer.registerChildForm("additionalOptions", this.additionalOptionsForm);

    this.additionalOptionsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.cipherFormContainer.patchCipher({
        notes: value.notes,
        reprompt: value.reprompt ? CipherRepromptType.Password : CipherRepromptType.None,
      });
    });
  }

  ngOnInit() {
    if (this.cipherFormContainer.originalCipherView) {
      this.additionalOptionsForm.patchValue({
        notes: this.cipherFormContainer.originalCipherView.notes,
        reprompt:
          this.cipherFormContainer.originalCipherView.reprompt === CipherRepromptType.Password,
      });
    }

    if (this.cipherFormContainer.config.mode === "partial-edit") {
      this.additionalOptionsForm.disable();
    }

    this.hasCustomFields = (this.updatedCipherView?.fields?.length ?? 0) > 0;
  }
}

import { DIALOG_DATA } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { FieldType } from "@bitwarden/common/vault/enums";

import { AddEditCustomFieldDialogComponent } from "./add-edit-custom-field-dialog.component";

describe("AddEditCustomFieldDialogComponent", () => {
  let component: AddEditCustomFieldDialogComponent;
  let fixture: ComponentFixture<AddEditCustomFieldDialogComponent>;
  const addField = jest.fn();

  beforeEach(async () => {
    addField.mockClear();

    await TestBed.configureTestingModule({
      imports: [AddEditCustomFieldDialogComponent],
      providers: [
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: DIALOG_DATA, useValue: { addField } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditCustomFieldDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges;
  });

  it("creates", () => {
    expect(component).toBeTruthy();
  });

  it("calls `addField` from DIALOG_DATA on addField", () => {
    component.customFieldForm.setValue({ type: FieldType.Text, label: "Test Label" });

    component.addField();

    expect(addField).toHaveBeenCalledWith(FieldType.Text, "Test Label");
  });
});

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mock } from "jest-mock-extended";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { DialogService } from "@bitwarden/components";

import { CipherFormContainer } from "../../cipher-form-container";

import { CustomFieldsComponent } from "./custom-fields.component";

describe("CustomFieldsComponent", () => {
  let component: CustomFieldsComponent;
  let fixture: ComponentFixture<CustomFieldsComponent>;
  let open: jest.Mock;

  beforeEach(async () => {
    open = jest.fn();

    await TestBed.configureTestingModule({
      imports: [CustomFieldsComponent],
      providers: [
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: CipherFormContainer, useValue: mock<CipherFormContainer>() },
      ],
    })
      .overrideProvider(DialogService, {
        useValue: {
          open,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("opens the add custom field dialog", () => {
    component.openAddCustomFieldDialog();

    expect(open).toHaveBeenCalled();
  });
});

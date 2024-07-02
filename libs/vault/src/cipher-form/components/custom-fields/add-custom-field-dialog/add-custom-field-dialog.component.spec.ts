import { ComponentFixture, TestBed } from "@angular/core/testing";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { I18nMockService } from "@bitwarden/components";

import { AddCustomFieldDialogComponent } from "./add-custom-field-dialog.component";

describe("AddCustomFieldDialogComponent", () => {
  let component: AddCustomFieldDialogComponent;
  let fixture: ComponentFixture<AddCustomFieldDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCustomFieldDialogComponent],
      providers: [{ provide: I18nService, useValue: I18nMockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddCustomFieldDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges;
  });

  it("creates", () => {
    expect(component).toBeTruthy();
  });
});

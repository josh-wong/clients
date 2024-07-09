import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

@Component({
  selector: "popup-page",
  templateUrl: "popup-page.component.html",
  standalone: true,
  host: {
    class: "tw-h-full tw-flex tw-flex-col tw-flex-1 tw-overflow-y-auto",
  },
  imports: [CommonModule],
})
export class PopupPageComponent implements OnInit {
  constructor(protected i18nService: I18nService) {}

  @Input() loading = false;
  @Input() loadingText?: string;

  ngOnInit() {
    this.loadingText = this.loadingText ?? this.i18nService.t("loading");
  }
}

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { IntegrationContext } from "@bitwarden/common/tools/integration/integration-context";

import { ForwarderConfiguration } from "./forwarder-configuration";
import { EmailDomainSettings, EmailPrefixSettings } from "./settings";

export class ForwarderContext<Settings> extends IntegrationContext {
  constructor(
    readonly configuration: ForwarderConfiguration<Settings>,
    readonly settings: Settings,
    i18nService: I18nService,
  ) {
    super(configuration, i18nService);
  }

  emailDomain(settings: EmailDomainSettings) {
    if (!settings.domain || settings.domain === "") {
      const error = this.i18nService.t("forwarderNoDomain", this.configuration.name);
      throw error;
    }

    return settings.domain;
  }

  emailPrefix(settings: EmailPrefixSettings) {
    if (!settings.prefix || settings.prefix === "") {
      const error = this.i18nService.t("forwarderNoPrefix", this.configuration.name);
      throw error;
    }

    return settings.prefix;
  }

  missingAccountIdCause() {
    return this.i18nService.t("forwarderNoAccountId", this.configuration.name);
  }
}

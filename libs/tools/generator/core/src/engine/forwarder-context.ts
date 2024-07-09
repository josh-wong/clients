import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { IntegrationContext } from "@bitwarden/common/tools/integration/integration-context";

import { ForwarderConfiguration } from "./forwarder-configuration";
import { EmailDomainSettings, EmailPrefixSettings } from "./settings";

export class ForwarderContext<Settings> extends IntegrationContext {
  constructor(
    readonly configuration: ForwarderConfiguration<Settings>,
    readonly settings: Settings,
    i18n: I18nService,
  ) {
    super(configuration, i18n);
  }

  emailDomain(settings: EmailDomainSettings) {
    if (!settings.domain || settings.domain === "") {
      const error = this.i18n.t("forwarderNoDomain", this.configuration.name);
      throw error;
    }

    return settings.domain;
  }

  emailPrefix(settings: EmailPrefixSettings) {
    if (!settings.prefix || settings.prefix === "") {
      const error = this.i18n.t("forwarderNoPrefix", this.configuration.name);
      throw error;
    }

    return settings.prefix;
  }

  missingAccountIdCause() {
    return this.i18n.t("forwarderNoAccountId", this.configuration.name);
  }
}

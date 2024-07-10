import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { IntegrationContext } from "@bitwarden/common/tools/integration/integration-context";

import { ForwarderConfiguration } from "./forwarder-configuration";
import { EmailDomainSettings, EmailPrefixSettings } from "./settings";

export class ForwarderContext<Settings extends object> extends IntegrationContext<Settings> {
  constructor(
    readonly configuration: ForwarderConfiguration<Settings>,
    settings: Settings,
    i18n: I18nService,
  ) {
    super(configuration, settings, i18n);
  }

  emailDomain(): Settings extends EmailDomainSettings ? string : never {
    const domain = "domain" in this.settings ? this.settings?.domain ?? "" : "";
    if (domain === "") {
      const error = this.i18n.t("forwarderNoDomain", this.configuration.name);
      throw error;
    }

    return domain as any;
  }

  emailPrefix(): Settings extends EmailPrefixSettings ? string : never {
    const prefix = "prefix" in this.settings ? this.settings?.prefix ?? "" : "";
    if (prefix === "") {
      const error = this.i18n.t("forwarderNoPrefix", this.configuration.name);
      throw error;
    }

    return prefix as any;
  }

  missingAccountIdCause() {
    return this.i18n.t("forwarderNoAccountId", this.configuration.name);
  }
}

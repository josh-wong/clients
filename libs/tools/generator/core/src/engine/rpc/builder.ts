import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { ApiSettings, RequestOptions } from "@bitwarden/common/tools/integration/rpc";

import { ForwarderConfiguration } from "../forwarder-configuration";
import { ForwarderContext } from "../forwarder-context";

import { CreateForwardingAddressRpc } from "./create-forwarding-address";
import { GetAccountIdRpc } from "./get-account-id";

export class ForwarderRequestBuilder {
  constructor(private i18nService: I18nService) {}

  private createContext<Settings>(
    configuration: ForwarderConfiguration<Settings>,
    settings: Settings,
  ) {
    return new ForwarderContext(configuration, settings, this.i18nService);
  }

  createForwardingAddress<Settings extends ApiSettings>(
    configuration: ForwarderConfiguration<Settings>,
    settings: Settings,
  ) {
    const context = this.createContext(configuration, settings);
    const rpc = new CreateForwardingAddressRpc<RequestOptions, Settings>(configuration, context);
    return rpc;
  }

  getAccountId<Settings extends ApiSettings>(
    configuration: ForwarderConfiguration<Settings>,
    settings: Settings,
  ) {
    const context = this.createContext(configuration, settings);
    const {
      forwarder: { getAccountId },
    } = configuration;
    if (!getAccountId) {
      return null;
    }

    const rpc = new GetAccountIdRpc<RequestOptions, Settings>(configuration, context);

    return rpc;
  }
}

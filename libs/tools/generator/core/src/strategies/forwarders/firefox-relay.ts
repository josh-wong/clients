import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { RestClient } from "@bitwarden/common/tools/integration/rpc";

import { DefaultFirefoxRelayOptions, Integrations } from "../../data";
import { ForwarderRequestBuilder } from "../../engine/rpc";
import { FirefoxRelayOptions } from "../../integration/firefox-relay";
import { ApiOptions } from "../../types";
import { ForwarderGeneratorStrategy } from "../forwarder-generator-strategy";

/** Generates a forwarding address for Firefox Relay */
export class FirefoxRelayForwarder extends ForwarderGeneratorStrategy<ApiOptions> {
  /** Instantiates the forwarder
   *  @param apiService used for ajax requests to the forwarding service
   *  @param i18nService used to look up error strings
   *  @param encryptService protects sensitive forwarder options
   *  @param keyService looks up the user key when protecting data.
   *  @param stateProvider creates the durable state for options storage
   */
  constructor(
    private client: RestClient,
    private request: ForwarderRequestBuilder,
    encryptService: EncryptService,
    keyService: CryptoService,
    stateProvider: StateProvider,
  ) {
    super(encryptService, keyService, stateProvider, DefaultFirefoxRelayOptions);
  }

  // configuration
  readonly key = Integrations.FirefoxRelay.forwarder.settings;
  readonly rolloverKey = Integrations.FirefoxRelay.forwarder.importBuffer;

  // request
  generate = async (options: FirefoxRelayOptions) => {
    const create = this.request.createForwardingAddress(Integrations.FirefoxRelay, options);
    const result = await this.client.fetchJson(create, options);
    return result;
  };
}

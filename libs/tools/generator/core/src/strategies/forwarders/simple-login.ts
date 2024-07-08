import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { RestClient } from "@bitwarden/common/tools/integration/rpc";

import { DefaultSimpleLoginOptions, Integrations } from "../../data";
import { ForwarderRequestBuilder } from "../../engine/rpc";
import { SelfHostedApiOptions } from "../../types";
import { ForwarderGeneratorStrategy } from "../forwarder-generator-strategy";

/** Generates a forwarding address for Simple Login */
export class SimpleLoginForwarder extends ForwarderGeneratorStrategy<SelfHostedApiOptions> {
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
    super(encryptService, keyService, stateProvider, DefaultSimpleLoginOptions);
  }

  // configuration
  readonly key = Integrations.SimpleLogin.forwarder.settings;
  readonly rolloverKey = Integrations.SimpleLogin.forwarder.importBuffer;

  // request
  generate = async (options: SelfHostedApiOptions) => {
    const create = this.request.createForwardingAddress(Integrations.SimpleLogin, options);
    const result = await this.client.fetchJson(create, options);
    return result;
  };
}

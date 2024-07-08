import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { RestClient } from "@bitwarden/common/tools/integration/rpc";

import { DefaultForwardEmailOptions, Integrations } from "../../data";
import { ForwarderRequestBuilder } from "../../engine/rpc";
import { EmailDomainOptions, ApiOptions } from "../../types";
import { ForwarderGeneratorStrategy } from "../forwarder-generator-strategy";

/** Generates a forwarding address for Forward Email */
export class ForwardEmailForwarder extends ForwarderGeneratorStrategy<
  ApiOptions & EmailDomainOptions
> {
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
    super(encryptService, keyService, stateProvider, DefaultForwardEmailOptions);
  }

  // configuration
  readonly key = Integrations.ForwardEmail.forwarder.settings;
  readonly rolloverKey = Integrations.ForwardEmail.forwarder.importBuffer;

  // request
  generate = async (options: ApiOptions & EmailDomainOptions) => {
    const create = this.request.createForwardingAddress(Integrations.ForwardEmail, options);
    const result = await this.client.fetchJson(create, options);
    return result;
  };
}

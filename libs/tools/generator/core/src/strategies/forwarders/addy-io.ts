import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { RestClient } from "@bitwarden/common/tools/integration/rpc";

import { Integrations } from "../../data";
import { ForwarderRequestBuilder } from "../../engine/rpc";
import { AddyIoOptions } from "../../integration/addy-io";
import { ForwarderGeneratorStrategy } from "../forwarder-generator-strategy";

/** Generates a forwarding address for addy.io (formerly anon addy) */
export class AddyIoForwarder extends ForwarderGeneratorStrategy<AddyIoOptions> {
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
    super(
      encryptService,
      keyService,
      stateProvider,
      Integrations.AddyIo.forwarder.defaultSettings as any,
    );
  }

  // configuration
  readonly key = Integrations.AddyIo.forwarder.settings;
  readonly rolloverKey = Integrations.AddyIo.forwarder.importBuffer;

  // FIXME: can be reduced into `ForwarderGeneratorStrategy`
  generate = async (options: AddyIoOptions) => {
    const create = this.request.createForwardingAddress(Integrations.AddyIo, options);
    const result = await this.client.fetchJson(create, options);
    return result;
  };
}

import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { StateProvider } from "@bitwarden/common/platform/state";
import { RestClient } from "@bitwarden/common/tools/integration/rpc";

import { Integrations } from "../../data";
import { ForwarderRequestBuilder } from "../../engine/rpc";
import { FastmailOptions, FastmailRequest } from "../../integration/fastmail";
import { ForwarderGeneratorStrategy } from "../forwarder-generator-strategy";

/** Generates a forwarding address for Fastmail */
export class FastmailForwarder extends ForwarderGeneratorStrategy<FastmailOptions> {
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
      Integrations.Fastmail.forwarder.defaultSettings as any,
    );
  }

  // configuration
  readonly key = Integrations.Fastmail.forwarder.settings;
  readonly rolloverKey = Integrations.Fastmail.forwarder.importBuffer;

  // request
  generate = async (options: FastmailOptions) => {
    const getAccount = this.request.getAccountId(Integrations.Fastmail, options);
    const create = this.request.createForwardingAddress(Integrations.Fastmail, options);

    const accountId = await this.client.fetchJson(getAccount, options);
    const requestOptions: FastmailRequest = { accountId: accountId, website: options.website };
    const result = await this.client.fetchJson(create, requestOptions);

    return result;
  };
}

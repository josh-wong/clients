import { UserKeyDefinition } from "@bitwarden/common/platform/state";
import { IntegrationConfiguration } from "@bitwarden/common/tools/integration/integration-configuration";
import { RequestOptions } from "@bitwarden/common/tools/integration/rpc/request-options";
import { RpcConfiguration } from "@bitwarden/common/tools/integration/rpc/rpc-definition";
import { BufferedKeyDefinition } from "@bitwarden/common/tools/state/buffered-key-definition";

import { ForwarderContext } from "./forwarder-context";

/** RequestOptions mixin for transmitting `getAccountId` result. */
export type RequestAccount = {
  accountId: string;
};

/** Forwarder-specific static definition */
export type ForwarderConfiguration<
  Settings,
  LegacyFormat extends Settings = Settings,
  Request extends RequestOptions = RequestOptions,
> = IntegrationConfiguration & {
  /** forwarder endpoint definition */
  forwarder: {
    /** default value of all fields */
    defaultSettings: Partial<LegacyFormat>;

    /** forwarder settings storage */
    settings: UserKeyDefinition<LegacyFormat>;

    /** forwarder settings import buffer; `undefined` when there is no buffer. */
    importBuffer?: BufferedKeyDefinition<LegacyFormat>;

    /** createForwardingEmail RPC definition */
    createForwardingEmail: RpcConfiguration<Request, ForwarderContext<Settings>>;

    /** getAccountId RPC definition; the response updates `accountId` which has a
     *  structural mixin type `RequestAccount`.
     */
    getAccountId?: RpcConfiguration<Request, ForwarderContext<Settings>>;
  };
};

import { UserKeyDefinition } from "@bitwarden/common/platform/state";
import { IntegrationConfiguration } from "@bitwarden/common/tools/integration/integration-configuration";
import { IntegrationRequest } from "@bitwarden/common/tools/integration/rpc/integration-request";
import { RpcConfiguration } from "@bitwarden/common/tools/integration/rpc/rpc-definition";
import { BufferedKeyDefinition } from "@bitwarden/common/tools/state/buffered-key-definition";

import { ForwarderContext } from "./forwarder-context";

/** RequestOptions mixin for transmitting `getAccountId` result. */
export type AccountRequest = {
  accountId?: string;
};

/** definition of the create forwarding request api call for an integration */
export type CreateForwardingEmailRpcDef<
  Settings extends object,
  Request extends IntegrationRequest = IntegrationRequest,
> = RpcConfiguration<Request, ForwarderContext<Settings>, string>;

/** definition of the get account id api call for an integration */
export type GetAccountIdRpcDef<
  Settings extends object,
  Request extends IntegrationRequest = IntegrationRequest,
> = RpcConfiguration<Request, ForwarderContext<Settings>, string>;

/** Forwarder-specific static definition */
export type ForwarderConfiguration<
  Settings extends object,
  LegacyFormat extends Settings = Settings,
  Request extends IntegrationRequest = IntegrationRequest,
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
    createForwardingEmail: CreateForwardingEmailRpcDef<Settings, Request>;

    /** getAccountId RPC definition; the response updates `accountId` which has a
     *  structural mixin type `RequestAccount`.
     */
    getAccountId?: GetAccountIdRpcDef<Settings, Request>;
  };
};

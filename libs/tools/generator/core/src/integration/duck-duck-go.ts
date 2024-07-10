import { IntegrationContext, IntegrationId } from "@bitwarden/common/tools/integration";
import { ApiSettings, IntegrationRequest } from "@bitwarden/common/tools/integration/rpc";

import { ForwarderConfiguration, ForwarderContext } from "../engine";
import { CreateForwardingEmailRpcDef } from "../engine/forwarder-configuration";
import { DUCK_DUCK_GO_BUFFER, DUCK_DUCK_GO_FORWARDER } from "../strategies/storage";
import { ApiOptions } from "../types";

// integration types
export type DuckDuckGoSettings = ApiSettings;
export type DuckDuckGoOptions = ApiOptions;
export type DuckDuckGoConfiguration = ForwarderConfiguration<DuckDuckGoSettings, DuckDuckGoOptions>;

// default values
const defaultSettings = Object.freeze({
  token: "",
});

// supported RPC calls
const createForwardingEmail = Object.freeze({
  url(_request: IntegrationRequest, context: ForwarderContext<DuckDuckGoSettings>) {
    return context.baseUrl() + "/email/addresses";
  },
  body(_request: IntegrationRequest, _context: ForwarderContext<DuckDuckGoSettings>) {
    return undefined;
  },
  hasJsonPayload(response: Response) {
    return response.status === 200 || response.status === 201;
  },
  processJson(json: any) {
    return [`${json.address}@duck.com`];
  },
} as CreateForwardingEmailRpcDef<DuckDuckGoSettings>);

// forwarder configuration
const forwarder = Object.freeze({
  defaultSettings,
  settings: DUCK_DUCK_GO_FORWARDER,
  importBuffer: DUCK_DUCK_GO_BUFFER,
  createForwardingEmail,
} as const);

// integration-wide configuration
export const DuckDuckGo = Object.freeze({
  id: "duckduckgo" as IntegrationId,
  name: "DuckDuckGo",
  baseUrl: "https://quack.duckduckgo.com/api",
  selfHost: "never",
  extends: ["forwarder"],
  authenticate(_request: IntegrationRequest, context: IntegrationContext<ApiSettings>) {
    return { Authorization: "Bearer " + context.authenticationToken() };
  },
  forwarder,
} as DuckDuckGoConfiguration);

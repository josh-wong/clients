import { IntegrationContext, IntegrationId } from "@bitwarden/common/tools/integration";
import {
  ApiSettings,
  IntegrationRequest,
  SelfHostedApiSettings,
} from "@bitwarden/common/tools/integration/rpc";

import { ForwarderConfiguration, ForwarderContext, EmailDomainSettings } from "../engine";
import { CreateForwardingEmailRpcDef } from "../engine/forwarder-configuration";
import { ADDY_IO_BUFFER, ADDY_IO_FORWARDER } from "../strategies/storage";
import { EmailDomainOptions, SelfHostedApiOptions } from "../types";

// integration types
export type AddyIoSettings = SelfHostedApiSettings & EmailDomainSettings;
export type AddyIoOptions = SelfHostedApiOptions & EmailDomainOptions;
export type AddyIoConfiguration = ForwarderConfiguration<AddyIoSettings, AddyIoOptions>;

// default values
const defaultSettings = Object.freeze({
  token: "",
  domain: "",
});

// supported RPC calls
const createForwardingEmail = Object.freeze({
  url(_request: IntegrationRequest, context: ForwarderContext<AddyIoSettings>) {
    return context.baseUrl(context.settings) + "/api/v1/aliases";
  },
  body(request: IntegrationRequest, context: ForwarderContext<AddyIoSettings>) {
    return {
      domain: context.emailDomain(context.settings),
      description: context.generatedBy(request),
    };
  },
  hasJsonPayload(response: Response) {
    return response.status === 200 || response.status === 201;
  },
  processJson(json: any) {
    return [json?.data?.email];
  },
} as CreateForwardingEmailRpcDef<AddyIoSettings>);

// forwarder configuration
const forwarder = Object.freeze({
  defaultSettings,
  settings: ADDY_IO_FORWARDER,
  importBuffer: ADDY_IO_BUFFER,
  createForwardingEmail,
} as const);

// integration-wide configuration
export const AddyIo = Object.freeze({
  id: "anonaddy" as IntegrationId,
  name: "Addy.io",
  baseUrl: "https://app.addy.io",
  selfHost: "maybe",
  extends: ["forwarder"],
  authenticate(settings: ApiSettings, context: IntegrationContext) {
    return { Authorization: "Bearer " + context.authenticationToken(settings) };
  },
  forwarder,
} as AddyIoConfiguration);

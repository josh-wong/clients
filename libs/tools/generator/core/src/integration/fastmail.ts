import { IntegrationContext, IntegrationId } from "@bitwarden/common/tools/integration";
import {
  ApiSettings,
  RequestOptions,
  RpcConfiguration,
} from "@bitwarden/common/tools/integration/rpc";

import {
  ForwarderConfiguration,
  ForwarderContext,
  EmailDomainSettings,
  EmailPrefixSettings,
  RequestAccount,
} from "../engine";
import { FASTMAIL_BUFFER, FASTMAIL_FORWARDER } from "../strategies/storage";
import { ApiOptions, EmailPrefixOptions } from "../types";

// integration types
export type FastmailSettings = ApiSettings & EmailPrefixSettings & EmailDomainSettings;
export type FastmailOptions = ApiOptions & EmailPrefixOptions & RequestAccount;
export type FastmailRequest = RequestOptions & RequestAccount;
export type FastmailConfiguration = ForwarderConfiguration<
  FastmailSettings,
  FastmailOptions,
  FastmailRequest
>;

// default values
const defaultSettings = Object.freeze({
  domain: "",
  prefix: "",
  token: "",
});

// supported RPC calls
const getAccountId = Object.freeze({
  url(_request: RequestOptions, context: ForwarderContext<FastmailSettings>) {
    return context.baseUrl(context.settings) + "/.well-known/jmap";
  },
  hasJsonPayload(response: Response) {
    return response.status === 200;
  },
  processJson(json: any, context: ForwarderContext<FastmailSettings>) {
    const result = json.primaryAccounts?.["https://www.fastmail.com/dev/maskedemail"] ?? undefined;

    return [result, result ?? context.missingAccountIdCause()];
  },
} as RpcConfiguration<RequestOptions, ForwarderContext<FastmailSettings>>);

const createForwardingEmail = Object.freeze({
  url(_request: RequestOptions, context: ForwarderContext<FastmailSettings>) {
    return context.baseUrl() + "/jmap/api/";
  },
  body(request: FastmailRequest, context: ForwarderContext<FastmailSettings>) {
    const body = {
      using: ["https://www.fastmail.com/dev/maskedemail", "urn:ietf:params:jmap:core"],
      methodCalls: [
        [
          "MaskedEmail/set",
          {
            accountId: request.accountId,
            create: {
              "new-masked-email": {
                state: "enabled",
                description: "",
                forDomain: context.website(request),
                emailPrefix: context.emailPrefix(context.settings),
              },
            },
          },
          "0",
        ],
      ],
    };

    return JSON.stringify(body);
  },
  hasJsonPayload(response: Response) {
    return response.status === 200;
  },
  processJson(json: any) {
    if (
      json.methodResponses != null &&
      json.methodResponses.length > 0 &&
      json.methodResponses[0].length > 0
    ) {
      if (json.methodResponses[0][0] === "MaskedEmail/set") {
        if (json.methodResponses[0][1]?.created?.["new-masked-email"] != null) {
          return [json.methodResponses[0][1]?.created?.["new-masked-email"]?.email] as const;
        }
        if (json.methodResponses[0][1]?.notCreated?.["new-masked-email"] != null) {
          const errorDescription =
            json.methodResponses[0][1]?.notCreated?.["new-masked-email"]?.description;
          return [undefined, errorDescription] as const;
        }
      } else if (json.methodResponses[0][0] === "error") {
        const errorDescription = json.methodResponses[0][1]?.description;
        return [undefined, errorDescription] as const;
      }
    }
  },
} as RpcConfiguration<FastmailRequest, ForwarderContext<FastmailSettings>>);

// forwarder configuration
const forwarder = Object.freeze({
  defaultSettings,
  settings: FASTMAIL_FORWARDER,
  importBuffer: FASTMAIL_BUFFER,
  createForwardingEmail,
  getAccountId,
} as const);

// integration-wide configuration
export const Fastmail = Object.freeze({
  id: "fastmail" as IntegrationId,
  name: "Fastmail",
  baseUrl: "https://api.fastmail.com",
  selfHost: "maybe",
  extends: ["forwarder"],
  authenticate(settings: ApiSettings, context: IntegrationContext) {
    return { Authorization: "Bearer " + context.authenticationToken(settings) };
  },
  forwarder,
} as FastmailConfiguration);

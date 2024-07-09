import { JsonRpc, IntegrationRequest } from "@bitwarden/common/tools/integration/rpc";

import { ForwarderConfiguration } from "../forwarder-configuration";
import { ForwarderContext } from "../forwarder-context";

export class CreateForwardingAddressRpc<
  Settings,
  Req extends IntegrationRequest = IntegrationRequest,
> implements JsonRpc<Req, string>
{
  constructor(
    readonly requestor: ForwarderConfiguration<Settings>,
    readonly context: ForwarderContext<Settings>,
  ) {}

  private get createForwardingEmail() {
    return this.requestor.forwarder.createForwardingEmail;
  }

  hasJsonPayload(response: Response): boolean {
    return this.createForwardingEmail.hasJsonPayload(response, this.context);
  }

  processJson(json: any): [string?, string?] {
    return this.createForwardingEmail.processJson(json, this.context);
  }

  private body(req: Req, _settings: Settings) {
    const body = this.createForwardingEmail.body;
    if (body) {
      const b = body(req, this.context);
      return b && JSON.stringify(b);
    }

    return undefined;
  }

  toRequest(req: Req) {
    const url = this.createForwardingEmail.url(req, this.context);
    const token = this.requestor.authenticate(this.context.settings, this.context);
    const body = this.body(req, this.context.settings);

    const request = new Request(url, {
      redirect: "manual",
      cache: "no-store",
      method: "POST",
      headers: new Headers({
        ...token,
        "Content-Type": "application/json",
      }),
      body,
    });

    return request;
  }
}

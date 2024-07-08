import { JsonRpc, RequestOptions } from "@bitwarden/common/tools/integration/rpc";

import { ForwarderConfiguration } from "../forwarder-configuration";
import { ForwarderContext } from "../forwarder-context";

export class GetAccountIdRpc<Req extends RequestOptions, Settings> implements JsonRpc<Req, string> {
  constructor(
    readonly requestor: ForwarderConfiguration<Settings>,
    readonly context: ForwarderContext<Settings>,
  ) {}

  hasJsonPayload(response: Response) {
    return this.requestor.forwarder.getAccountId.hasJsonPayload(response, this.context);
  }

  processJson(json: any) {
    return this.requestor.forwarder.getAccountId.processJson(json, this.context);
  }

  private body(req: Req, settings: Settings) {
    const body = this.requestor.forwarder.getAccountId.body(req, this.context);
    if (body) {
      const b = body(req, settings, this.context);
      return b && JSON.stringify(b);
    }

    return undefined;
  }

  toRequest(req: Req) {
    const url = this.requestor.forwarder.getAccountId.url(req, this.context);
    const token = this.requestor.authenticate(this.context.settings, this.context);
    const body = this.body(req, this.context.settings);

    const request = new Request(url, {
      redirect: "manual",
      cache: "no-store",
      method: "GET",
      headers: new Headers({
        ...token,
        "Content-Type": "application/json",
      }),
      body,
    });

    return request;
  }
}

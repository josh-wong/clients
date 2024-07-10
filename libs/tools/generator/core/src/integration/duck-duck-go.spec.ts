import { mock } from "jest-mock-extended";

import { ForwarderContext } from "../engine";

import { DuckDuckGo, DuckDuckGoSettings } from "./duck-duck-go";

describe("DuckDuckGo forwarder", () => {
  const context = mock<ForwarderContext<DuckDuckGoSettings>>();

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("authenticate", () => {
    it("returns a bearer header with the token", () => {
      context.authenticationToken.mockReturnValue("token");
      const settings = {};

      const result = DuckDuckGo.authenticate(settings, context);

      expect(result).toEqual({ Authorization: "Bearer token" });
      expect(context.authenticationToken).toHaveBeenCalledWith(settings);
    });
  });

  describe("createForwardingEmail", () => {
    describe("url", () => {
      it("returns the alias path", () => {
        context.baseUrl.mockReturnValue("");

        const result = DuckDuckGo.forwarder.createForwardingEmail.url(null, context);

        expect(result).toEqual("/email/addresses");
      });
    });

    describe("body", () => {
      it("returns undefined", () => {
        const result = DuckDuckGo.forwarder.createForwardingEmail.body(null, context);

        expect(result).not.toBeDefined();
      });
    });

    describe("hasJsonPayload", () => {
      it.each([[200], [201]])("returns true when the status is $%i", (status) => {
        const result = DuckDuckGo.forwarder.createForwardingEmail.hasJsonPayload(
          { status } as Response,
          context,
        );
        expect(result).toBeTruthy();
      });
    });

    describe("processJson", () => {
      it("should read the email from the response", () => {
        const json = { address: "foo" };
        const result = DuckDuckGo.forwarder.createForwardingEmail.processJson(json, context);
        expect(result).toEqual(["foo@duck.com"]);
      });
    });
  });
});

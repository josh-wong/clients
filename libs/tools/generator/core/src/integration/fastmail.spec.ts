import { mock } from "jest-mock-extended";

import { ForwarderContext } from "../engine";

import { Fastmail, FastmailSettings } from "./fastmail";

describe("Fastmail forwarder", () => {
  const context = mock<ForwarderContext<FastmailSettings>>();

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("authenticate", () => {
    it("returns a bearer header with the token", () => {
      context.authenticationToken.mockReturnValue("token");
      const settings = {};

      const result = Fastmail.authenticate(settings, context);

      expect(result).toEqual({ Authorization: "Bearer token" });
      expect(context.authenticationToken).toHaveBeenCalledWith(settings);
    });
  });

  describe("getAccountId", () => {
    describe("url", () => {
      it("returns the alias path", () => {
        context.baseUrl.mockReturnValue("");

        const result = Fastmail.forwarder.getAccountId.url(null, context);

        expect(result).toEqual("/.well-known/jmap");
      });
    });

    describe("hasJsonPayload", () => {
      it.each([[200]])("returns true when the status is $%i", (status) => {
        const result = Fastmail.forwarder.getAccountId.hasJsonPayload(
          { status } as Response,
          context,
        );
        expect(result).toBeTruthy();
      });
    });

    describe("processJson", () => {
      it("looks up an account id", () => {
        const json = {
          primaryAccounts: {
            "https://www.fastmail.com/dev/maskedemail": "some id",
          },
        };

        const result = Fastmail.forwarder.getAccountId.processJson(json, context);
        expect(result).toEqual(["some id"]);
      });

      it("returns a cause when account id is missing", () => {
        context.missingAccountIdCause.mockReturnValue("cause");
        const json = {
          primaryAccounts: {
            "https://www.fastmail.com/dev/maskedemail": null as string,
          },
        };

        const result = Fastmail.forwarder.getAccountId.processJson(json, context);
        expect(result).toEqual([undefined, "cause"]);
      });

      it("returns a cause when masked mail account is missing", () => {
        context.missingAccountIdCause.mockReturnValue("cause");
        const json = { primaryAccounts: {} };

        const result = Fastmail.forwarder.getAccountId.processJson(json, context);
        expect(result).toEqual([undefined, "cause"]);
      });

      it("returns a cause when all accounts are missing", () => {
        context.missingAccountIdCause.mockReturnValue("cause");
        const json = { primaryAccounts: null as any };

        const result = Fastmail.forwarder.getAccountId.processJson(json, context);
        expect(result).toEqual([undefined, "cause"]);
      });
    });
  });

  describe("createForwardingEmail", () => {
    describe("url", () => {
      it("returns the alias path", () => {
        context.baseUrl.mockReturnValue("");

        const result = Fastmail.forwarder.createForwardingEmail.url(null, context);

        expect(result).toEqual("/jmap/api/");
      });
    });

    describe("body", () => {
      it("creates a request body", () => {
        context.website.mockReturnValue("website");
        context.emailPrefix.mockReturnValue("emailPrefix");
        const request = { accountId: "accountId", website: "" };

        const result = Fastmail.forwarder.createForwardingEmail.body(request, context);
        const methodCall = result.methodCalls[0][1];

        expect(methodCall.accountId).toEqual("accountId");
        expect(methodCall.create["new-masked-email"].forDomain).toEqual("website");
        expect(methodCall.create["new-masked-email"].emailPrefix).toEqual("emailPrefix");
      });
    });

    describe("hasJsonPayload", () => {
      it.each([[200]])("returns true when the status is $%i", (status) => {
        const result = Fastmail.forwarder.createForwardingEmail.hasJsonPayload(
          { status } as Response,
          context,
        );
        expect(result).toBeTruthy();
      });
    });

    describe("processJson", () => {
      it("returns the generated email address", () => {
        const body = {
          methodResponses: [
            [
              "MaskedEmail/set",
              {
                created: {
                  "new-masked-email": {
                    email: "jdoe@example.com",
                  },
                },
              },
            ],
          ],
        };

        const result = Fastmail.forwarder.createForwardingEmail.processJson(body, context);

        expect(result).toEqual(["jdoe@example.com"]);
      });

      it("returns a forwarder error if masked email creation fails", () => {
        const notCreatedBody = {
          methodResponses: [
            [
              "MaskedEmail/set",
              {
                notCreated: { "new-masked-email": { description: "It turned inside out!" } },
              },
            ],
          ],
        };

        const notCreatedResult = Fastmail.forwarder.createForwardingEmail.processJson(
          notCreatedBody,
          context,
        );

        expect(notCreatedResult).toEqual([undefined, "It turned inside out!"]);

        const generalErrorBody = {
          methodResponses: [["error", { description: "And then it exploded!" }]],
        };

        const generalErrorResult = Fastmail.forwarder.createForwardingEmail.processJson(
          generalErrorBody,
          context,
        );

        expect(generalErrorResult).toEqual([undefined, "And then it exploded!"]);
      });

      it.each([
        null,
        [],
        [[]],
        [["MaskedEmail/not-a-real-op"]],
        [["MaskedEmail/set", null]],
        [["MaskedEmail/set", { created: null }]],
        [["MaskedEmail/set", { created: { "new-masked-email": null } }]],
        [["MaskedEmail/set", { notCreated: null }]],
        [["MaskedEmail/set", { notCreated: { "new-masked-email": null } }]],
      ])("returns undefined if the jmap request is malformed (=%p)", (response: any) => {
        const generalErrorBody = {
          methodResponses: response,
        };

        const result = Fastmail.forwarder.createForwardingEmail.processJson(
          generalErrorBody,
          context,
        );

        expect(result).toBeUndefined();
      });
    });
  });
});

import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { isPrivateAddress, normalizeTargetUrlInput, validateTargetUrl } from "./url-policy";

const publicResolver = async () => [{ address: "93.184.216.34" }] as const;

describe("public target URL policy", () => {
  it("normalizes domain-only and protocol-relative input to HTTPS", () => {
    expect(normalizeTargetUrlInput("example.com/path")).toBe("https://example.com/path");
    expect(normalizeTargetUrlInput("//www.example.com")).toBe("https://www.example.com");
  });

  it("accepts a public WWW target after DNS validation", async () => {
    const result = await validateTargetUrl("www.example.com/audit#section", false, { resolver: publicResolver });
    expect(result.toString()).toBe("https://www.example.com/audit");
  });

  it.each(["file:///etc/passwd", "ftp://example.com", "javascript:alert(1)"])(
    "rejects unsupported scheme %s",
    async (target) => {
      await expect(validateTargetUrl(target, false, { resolver: publicResolver })).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    },
  );

  it.each(["127.0.0.1", "10.0.0.7", "169.254.169.254", "::1", "fc00::1", "fd12::1", "fe80::1", "2001:db8::1"])(
    "recognizes non-public address %s",
    (address) => expect(isPrivateAddress(address)).toBe(true),
  );

  it("blocks a hostname when any DNS answer is non-public", async () => {
    await expect(validateTargetUrl("https://example.com", false, {
      resolver: async () => [{ address: "93.184.216.34" }, { address: "127.0.0.1" }],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns a safe retryable error when DNS resolution fails", async () => {
    const error = await validateTargetUrl("https://missing.example", false, {
      resolver: async () => { throw new Error("resolver details"); },
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: "TARGET_UNAVAILABLE", status: 422 });
    expect((error as Error).message).not.toContain("resolver details");
  });
});

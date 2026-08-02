import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./schemas";

describe("createProjectSchema", () => {
  it("accepts the bundled demo with a source root", () => {
    expect(createProjectSchema.safeParse({ name: "NovaMart", projectType: "BUNDLED_DEMO", targetUrl: "http://localhost:3001", localSourceRoot: "../novamart" }).success).toBe(true);
  });

  it("rejects a source root for external audits", () => {
    expect(createProjectSchema.safeParse({ name: "External", projectType: "EXTERNAL_AUDIT", targetUrl: "https://example.com", localSourceRoot: "/tmp/site" }).success).toBe(false);
  });
});

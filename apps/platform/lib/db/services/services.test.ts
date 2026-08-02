import { describe, expect, it } from "vitest";
import { projectService, repairService, scanService } from "./index";

describe("database service boundary", () => {
  it("exposes the expected project, scan, and repair operations", () => {
    expect(projectService.list).toBeTypeOf("function");
    expect(scanService.create).toBeTypeOf("function");
    expect(repairService.createProposal).toBeTypeOf("function");
  });
});

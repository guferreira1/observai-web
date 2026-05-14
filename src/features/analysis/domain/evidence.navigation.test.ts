import { describe, expect, it } from "vitest";

import {
  buildEvidenceAnchorId,
  buildEvidenceViewerHref,
  readEvidenceIdFromHash,
  readFocusedEvidenceId
} from "@/features/analysis/domain/evidence.navigation";

describe("evidence navigation", () => {
  it("builds viewer links with query and anchor references", () => {
    expect(buildEvidenceViewerHref("analysis-1", "logs/error rate")).toBe(
      "/analyses/analysis-1/evidence?evidence=logs%2Ferror+rate#evidence-logs%2Ferror%20rate"
    );
  });

  it("builds stable anchor ids from evidence ids", () => {
    expect(buildEvidenceAnchorId("evidence-1")).toBe("evidence-evidence-1");
  });

  it("reads focused evidence ids from query before hash", () => {
    const searchParams = new URLSearchParams({ evidence: "evidence-1" });

    expect(readFocusedEvidenceId({ searchParams, hash: "#evidence-evidence-2" })).toBe("evidence-1");
  });

  it("supports legacy evidenceId query parameters", () => {
    const searchParams = new URLSearchParams({ evidenceId: "evidence-2" });

    expect(readFocusedEvidenceId({ searchParams, hash: "" })).toBe("evidence-2");
  });

  it("reads evidence ids from prefixed or raw hashes", () => {
    expect(readEvidenceIdFromHash("#evidence-evidence-3")).toBe("evidence-3");
    expect(readEvidenceIdFromHash("#evidence-4")).toBe("4");
  });
});

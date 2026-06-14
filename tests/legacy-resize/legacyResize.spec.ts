import { describe, expect, it } from "vitest";
import { calculateLegacyModalSize } from "./legacyResize";
import { legacyResizeFixture } from "./legacyResize.fixture";

describe("legacy ModalViewerImage resize", () => {
  it("matches the captured legacy size matrix", () => {
    expect.assertions(legacyResizeFixture.cases.length);

    for (const resizeCase of legacyResizeFixture.cases) {
      expect(
        calculateLegacyModalSize(resizeCase.input),
        resizeCase.name,
      ).toEqual(resizeCase.expected);
    }
  });
});

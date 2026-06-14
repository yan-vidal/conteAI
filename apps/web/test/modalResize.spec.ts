import { describe, expect, it } from "vitest";
import { legacyResizeFixture } from "../../../tests/legacy-resize/legacyResize.fixture.js";
import { calculateModalSize } from "../utils/modalResize.js";

describe("modal resize math", () => {
  it("matches the captured legacy size matrix", () => {
    expect.assertions(legacyResizeFixture.cases.length);

    for (const resizeCase of legacyResizeFixture.cases) {
      expect(calculateModalSize(resizeCase.input), resizeCase.name).toEqual(
        resizeCase.expected,
      );
    }
  });
});

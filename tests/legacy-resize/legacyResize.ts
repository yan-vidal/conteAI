export interface LegacyResizeInput {
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly isRotated: boolean;
}

export type LegacySizeValue = `${number}px` | number;

export interface LegacyModalSize {
  readonly width: LegacySizeValue;
  readonly height: LegacySizeValue;
}

export function calculateLegacyModalSize(
  input: LegacyResizeInput,
): LegacyModalSize {
  let proportion = input.imageWidth / input.imageHeight;
  const screenWidth = input.viewportWidth - 100;
  const screenHeight = input.viewportHeight - 150;
  const screenProportion = screenWidth / screenHeight;

  if (input.isRotated) {
    proportion = input.imageHeight / input.imageWidth;

    if (proportion > screenProportion) {
      if (proportion < 1) {
        return {
          width: `${screenHeight * proportion}px`,
          height: `${screenWidth * proportion}px`,
        };
      }

      return {
        width: `${
          (screenHeight < screenWidth ? screenHeight : screenWidth) / proportion
        }px`,
        height: screenWidth > screenHeight ? screenHeight : `${screenWidth}px`,
      };
    }

    if (proportion > 1) {
      return {
        width: `${screenHeight / proportion}px`,
        height: `${screenWidth / screenProportion}px`,
      };
    }

    return {
      width: `${screenHeight}px`,
      height: `${
        (screenProportion > 1 ? screenHeight : screenWidth) * proportion
      }px`,
    };
  }

  if (proportion > screenProportion) {
    return {
      width: `${screenWidth}px`,
      height: `${screenWidth / proportion}px`,
    };
  }

  return {
    width: `${screenHeight * proportion}px`,
    height: `${screenHeight}px`,
  };
}

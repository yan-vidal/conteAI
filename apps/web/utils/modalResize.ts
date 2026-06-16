export interface ModalResizeInput {
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly isRotated: boolean;
}

export type ModalSizeValue = `${number}px` | number;

export interface ModalSize {
  readonly width: ModalSizeValue;
  readonly height: ModalSizeValue;
}

export const calculateModalSize = (input: ModalResizeInput): ModalSize => {
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
};

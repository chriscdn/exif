// TS type guard
const isFile = (e: File | string): e is File => typeof e !== "string";

/**
 * A browser function for getting the width and height of an image.
 *
 * @param file {File}
 * @returns
 */
const getSizeInBrowser = async (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const URL = window.URL || window.webkitURL;
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
      });
    };

    image.src = URL.createObjectURL(file);
  });
};

/**
 * Convert a time zone offset to minutes.  e.g., +02:00 => 120
 *
 * @param offset
 * @returns
 */
const offsetStringToMinutes = (offset: string): number => {
  const split = offset.split(":");
  const hours = parseInt(split[0]);
  const minutes = parseInt(split[1]);

  const factor = hours > 0 ? 1 : -1;

  return hours * 60 + factor * minutes;
};

const convertLatLonToDecimal = (
  coord: string | null | undefined,
): number | null => {
  const match = coord?.match(/^(\d+),(\d+\.\d+)([NSWE])$/);

  if (match) {
    const [_, degreesStr, minutesStr, hemisphere] = match;
    const degrees = parseInt(degreesStr, 10);
    const minutes = parseFloat(minutesStr);

    // Convert to decimal degrees
    let decimal = degrees + minutes / 60;

    // Apply hemisphere correction
    if (hemisphere === "S" || hemisphere === "W") {
      decimal *= -1;
    }

    return decimal;
  } else {
    return null;
  }
};

const roundToSignificantDigits = (
  value: number | null | undefined,
  n: number,
): number | null => {
  if (typeof value === "number") {
    const multiplier = Math.pow(10, n);
    return Math.round(value * multiplier) / multiplier;
  } else {
    return null;
  }
};

export {
  isFile,
  getSizeInBrowser,
  offsetStringToMinutes,
  convertLatLonToDecimal,
  roundToSignificantDigits,
};

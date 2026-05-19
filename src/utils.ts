import { toIntegerOrThrow, toNumberOrThrow } from "@chriscdn/to-number";

const isFile = (e: File | string): e is File => typeof e !== "string";
const isString = (value: unknown): value is string => typeof value === "string";

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
  const sign = offset.startsWith("-") ? -1 : 1;
  const [h, m] = offset.replace(/^[-+]/, "").split(":");

  const isUTC = h === "Z";

  const hours = isUTC ? 0 : toIntegerOrThrow(h);
  const minutes = isUTC ? 0 : toIntegerOrThrow(m);

  return sign * (hours * 60 + minutes);
};

const convertLatLonToDecimal = (
  coord: string | null | undefined,
): number | null => {
  const match = coord?.match(/^(\d+),(\d+\.\d+)([NSWE])$/);

  if (match) {
    const [_, degreesStr, minutesStr, hemisphere] = match;

    const degrees = toIntegerOrThrow(degreesStr);
    const minutes = toNumberOrThrow(minutesStr);

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

export {
  convertLatLonToDecimal,
  getSizeInBrowser,
  isFile,
  isString,
  offsetStringToMinutes,
};

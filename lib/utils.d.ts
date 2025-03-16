declare const isFile: (e: File | string) => e is File;
/**
 * A browser function for getting the width and height of an image.
 *
 * @param file {File}
 * @returns
 */
declare const getSizeInBrowser: (file: File) => Promise<{
    width: number;
    height: number;
}>;
/**
 * Convert a time zone offset to minutes.  e.g., +02:00 => 120
 *
 * @param offset
 * @returns
 */
declare const offsetStringToMinutes: (offset: string) => number;
declare const convertLatLonToDecimal: (coord: string | null | undefined) => number | null;
declare const roundToSignificantDigits: (value: number | null | undefined, n: number) => number | null;
export { isFile, getSizeInBrowser, offsetStringToMinutes, convertLatLonToDecimal, roundToSignificantDigits, };

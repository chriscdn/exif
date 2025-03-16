import { LocationInfo, RawExifData, SizeInfo, Source } from "./types";
declare const extractDescription: (rawExif: RawExifData) => string | null;
/**
 * Extracts the latitude, longitude, and time zone. The latitude and longitude
 * are rounded to 6 significant digits.
 *
 * @param rawExif
 * @returns
 */
declare const extractLatLngTz: (rawExif: RawExifData) => LocationInfo;
/**
 * Seems .jpg files exported from Lightroom does not contain width and height information.
 *
 * @param rawExif
 * @param item
 * @returns
 */
declare const extractHeightWidth: (rawExif: RawExifData, item: Source) => Promise<SizeInfo>;
export { extractDescription, extractLatLngTz, extractHeightWidth };

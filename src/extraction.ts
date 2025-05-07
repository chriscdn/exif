import tzlookup from "tz-lookup";
import {
  convertLatLonToDecimal,
  getSizeInBrowser,
  isFile,
  roundToSignificantDigits,
} from "./utils";
import { LocationInfo, RawExifData, SizeInfo, Source } from "./types";
import arrify from "arrify";

const extractTitle = (rawExif: RawExifData) => {
  const title = rawExif.title?.value ?? rawExif.ObjectName ?? null;
  return title ? String(title).trim() : null;
};

const extractCaption = (rawExif: RawExifData) => {
  const caption = rawExif.description?.value ?? rawExif.ImageDescription ??
    rawExif.Caption ?? null;
  return caption ? String(caption).trim() : null;
};

const extractKeywords = (rawExif: RawExifData) => {
  return arrify(
    rawExif.Keywords ?? rawExif.subject ?? rawExif.weightedFlatSubject ?? [],
  );
};

/**
 * Extracts the latitude, longitude, and time zone. The latitude and longitude
 * are rounded to 6 significant digits.
 *
 * @param rawExif
 * @returns
 */
const extractLatLngTz = (rawExif: RawExifData): LocationInfo => {
  const latitude = (rawExif.latitude as number) ??
    convertLatLonToDecimal(rawExif.GPSLatitude) ??
    null;

  const longitude = (rawExif.longitude as number) ??
    convertLatLonToDecimal(rawExif.GPSLongitude) ??
    null;

  // Use TZ service?
  // https://trackmytour.com/tapi/tz/-3/55/
  const timeZone = latitude !== null && longitude !== null
    ? tzlookup(latitude, longitude)
    : null;

  // https://en.wikipedia.org/wiki/Decimal_degrees
  return {
    latitude: roundToSignificantDigits(latitude, 6),
    longitude: roundToSignificantDigits(longitude, 6),
    timeZone,
  };
};

/**
 * Seems .jpg files exported from Lightroom does not contain width and height information.
 *
 * @param rawExif
 * @param item
 * @returns
 */
const extractHeightWidth = async (
  rawExif: RawExifData,
  item: Source,
): Promise<SizeInfo> => {
  let width = (rawExif.ImageWidth as number) ??
    (rawExif.ExifImageWidth as number) ?? 0;
  let height = (rawExif.ImageHeight as number) ??
    (rawExif.ExifImageHeight as number) ?? 0;

  if (width > 0 && height > 0) {
    // great!
  } else {
    // if we have a file path, on node.js
    if (typeof item === "string") {
      // This block is for node.js only.
      const { default: probe } = await import("probe-image-size");
      const fs = await import("fs");
      const results = await probe(fs.createReadStream(item));

      if (results?.width && results?.height) {
        width = results.width;
        height = results.height;
      }
    } else if (window && isFile(item)) {
      const results = await getSizeInBrowser(item);

      width = results.width;
      height = results.height;
    } else {
      // out of luck
    }
  }

  return { width, height };
};

export {
  extractCaption,
  extractHeightWidth,
  extractKeywords,
  extractLatLngTz,
  extractTitle,
};

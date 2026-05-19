// https://github.com/photostructure/tz-lookup
import tzlookup from "@photostructure/tz-lookup";
import arrify from "arrify";
import { isNumber, RoundingMode, toNumber } from "@chriscdn/to-number";

import {
  convertLatLonToDecimal,
  getSizeInBrowser,
  isFile,
  isString,
} from "./utils";

import { LocationInfo, RawExifData, SizeInfo, Source } from "./types";

const extractTitle = (rawExif: RawExifData) => {
  const title = rawExif.title?.value ?? rawExif.ObjectName ?? null;
  return title ? String(title).trim() : null;
};

const extractCaption = (rawExif: RawExifData) => {
  const caption =
    rawExif.description?.value ??
    rawExif.ImageDescription ??
    rawExif.Caption ??
    null;

  return caption ? String(caption).trim() : null;
};

const extractKeywords = (rawExif: RawExifData) =>
  arrify(
    rawExif.Keywords ?? rawExif.subject ?? rawExif.weightedFlatSubject ?? [],
  );

/**
 * Extracts the latitude, longitude, and time zone. The latitude and longitude
 * are rounded to 6 digits.
 *
 * @param rawExif
 * @returns
 */
const extractLatLngTz = (rawExif: RawExifData): LocationInfo => {
  // This can be NaN, number, or DMS

  const rawLatitude = rawExif.latitude;
  const rawLongitude = rawExif.longitude;

  const rawGpsLatitude = rawExif.GPSLatitude;
  const rawGpsLongitude = rawExif.GPSLongitude;

  const latitude = isNumber(rawLatitude)
    ? rawLatitude
    : isString(rawGpsLatitude)
      ? convertLatLonToDecimal(rawGpsLatitude)
      : null;

  const longitude = isNumber(rawLatitude)
    ? rawLongitude
    : isString(rawGpsLongitude)
      ? convertLatLonToDecimal(rawGpsLongitude)
      : null;

  const timeZone =
    isNumber(latitude) && isNumber(longitude)
      ? tzlookup(latitude, longitude)
      : null;

  // https://en.wikipedia.org/wiki/Decimal_degrees
  return {
    latitude: toNumber(latitude, {
      digits: 6,
      roundingMode: RoundingMode.ROUND,
    }),
    longitude: toNumber(longitude, {
      digits: 6,
      roundingMode: RoundingMode.ROUND,
    }),
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
  let width =
    toNumber(rawExif.ImageWidth) ?? toNumber(rawExif.ExifImageWidth) ?? 0;

  let height =
    toNumber(rawExif.ImageHeight) ?? toNumber(rawExif.ExifImageHeight) ?? 0;

  if (width > 0 && height > 0) {
    // great!
  } else if (isString(item)) {
    const { nodeProbeImageSize } = await import("./node-image-size");

    const results = await nodeProbeImageSize(item);

    width = results.width;
    height = results.height;
  } else if (window && isFile(item)) {
    const results = await getSizeInBrowser(item);

    width = results.width;
    height = results.height;
  } else {
    // out of luck
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

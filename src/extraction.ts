// https://github.com/photostructure/tz-lookup
import tzlookup from "@photostructure/tz-lookup";
import arrify from "arrify";
import {
  isNumber,
  RoundingMode,
  toNumber,
  toNumberOrThrow,
} from "@chriscdn/to-number";

import { getSizeInBrowser, isFile, isString } from "./utils";
import { LocationInfo, SizeInfo, Source } from "./types";

const extractTitle = (exifReaderTags: ExifReader.Tags) => {
  const title =
    exifReaderTags["title"]?.description ??
    exifReaderTags["Object Name"]?.description ??
    exifReaderTags["XPTitle"]?.description;

  return title ? String(title).trim() : null;
};

const extractCaption = (exifReaderTags: ExifReader.Tags) => {
  const caption =
    exifReaderTags["description"]?.description ??
    exifReaderTags["ImageDescription"]?.description ??
    exifReaderTags["Caption/Abstract"]?.description;

  return caption ? String(caption).trim() : null;
};

const extractKeywords = (exifReaderTags: ExifReader.Tags): string[] => {
  return [
    ...new Set(
      [
        ...arrify(exifReaderTags["subject"]),
        ...arrify(exifReaderTags["Keywords"]),
        ...arrify(exifReaderTags["XPKeywords"]),
      ]
        // Filter out null or undefined tag entries up front
        .filter(Boolean)
        // Normalize objects and strings into a flat string array
        .map((item) =>
          typeof item === "object" ? item.description || "" : item,
        )
        // Split comma/semicolon delimited blocks (common in legacy IPTC/Windows tags)
        .flatMap((text) => text.split(/[;,]+/))
        // Clean up whitespace and normalize casing
        .map((token) => token.trim().toLowerCase())
        // Remove empty strings created by the splitting process
        .filter(Boolean),
    ),
  ];
};
// arrify(
//   rawExif.Keywords ?? rawExif.subject ?? rawExif.weightedFlatSubject ?? [],
// );

/**
 * Extracts the latitude, longitude, and time zone. The latitude and longitude
 * are rounded to 6 digits.
 *
 * @param rawExif
 * @returns
 */

// const _extractNorthSouth = (exifReaderTags: ExifReader.Tags) => {
//   const ns = arrify(exifReaderTags["GPSLatitudeRef"]?.value)[0];

//   if (ns) {
//     return String(ns);
//   } else {
//     const latString = exifReaderTags["GPSLatitude"]?.description;

//     if (latString) {
//       const lastChar = latString[latString.length - 1];

//       if (lastChar && ["N", "S"].includes(lastChar)) {
//         return lastChar;
//       }
//     }
//   }
//   return null;
// };

/**
 * The latitude and longitude can appear in different ways. Either, GPSLatitude
 * & GPSLongitude where the hemispheres (N, W, S, E) as a  suffix on the
 * coordinates, or is in a separate GPSLatitudeRef and GPSLongitudeRef fields.
 * This block handles both cases.
 *
 * @param exifReaderTags
 * @returns
 */
const extractLatLngTz = (exifReaderTags: ExifReader.Tags): LocationInfo => {
  // latString can actually be a number as well

  let latString = exifReaderTags["GPSLatitude"]?.description as
    | string
    | number
    | undefined;

  let lonString = exifReaderTags["GPSLongitude"]?.description as
    | string
    | number
    | undefined;

  if (latString && lonString) {
    let northOrSouth: "N" | "S" | null = null;
    let westOrEast: "W" | "E" | null = null;

    if (
      isString(latString) &&
      (latString.endsWith("N") || latString.endsWith("S"))
    ) {
      // case "43.642956N"
      northOrSouth = latString[latString.length - 1] as "N" | "S";
      latString = latString.slice(0, -1);
    } else {
      // check if hemisphere defined in GPSLatitudeRef field
      const gpsLatitudeRef = arrify(exifReaderTags["GPSLatitudeRef"]?.value)[0];

      if (gpsLatitudeRef === "N" || gpsLatitudeRef === "S") {
        northOrSouth = gpsLatitudeRef;
      }
    }

    if (
      isString(lonString) &&
      (lonString.endsWith("W") || lonString.endsWith("E"))
    ) {
      westOrEast = lonString[lonString.length - 1] as "W" | "E";
      lonString = lonString.slice(0, -1);
    } else {
      const gpsLongitudeRef = arrify(
        exifReaderTags["GPSLongitudeRef"]?.value,
      )[0];

      if (gpsLongitudeRef === "W" || gpsLongitudeRef === "E") {
        westOrEast = gpsLongitudeRef;
      }
    }

    const latNumber = toNumber(latString, {
      digits: 6,
      roundingMode: RoundingMode.ROUND,
    });

    const lonNumber = toNumber(lonString, {
      digits: 6,
      roundingMode: RoundingMode.ROUND,
    });

    if (
      isNumber(latNumber) &&
      isNumber(lonNumber) &&
      isString(northOrSouth) &&
      isString(westOrEast)
    ) {
      const isSouthernHemsiphere = northOrSouth === "S";
      const isWesternHemisphere = westOrEast === "W";

      const latitudeFactor = isSouthernHemsiphere ? -1 : 1;
      const longitudeFactor = isWesternHemisphere ? -1 : 1;

      const latitude = latitudeFactor * latNumber;
      const longitude = longitudeFactor * lonNumber;

      const timeZone =
        isNumber(latitude) && isNumber(longitude)
          ? tzlookup(latitude, longitude)
          : null;

      // https://en.wikipedia.org/wiki/Decimal_degrees
      return {
        latitude,
        longitude,
        timeZone,
      };
    }
  }

  return {
    latitude: null,
    longitude: null,
    timeZone: null,
  };
};

/**
 *
 * @param exifReaderTags {ExifReader.Tags}
 * @param item
 * @returns
 */
const extractHeightWidth = async (
  exifReaderTags: ExifReader.Tags,
  item: Source,
): Promise<SizeInfo> => {
  let width = exifReaderTags["Image Width"]?.value ?? 0;
  let height = exifReaderTags["Image Height"]?.value ?? 0;

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

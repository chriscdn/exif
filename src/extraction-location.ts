// https://github.com/photostructure/tz-lookup
import tzlookup from "@photostructure/tz-lookup";

import arrify from "arrify";
import { LocationInfo } from "./types";
import { isString } from "./utils";
import { toNumber, RoundingMode, isNumber } from "@chriscdn/to-number";

/**
 * The latitude and longitude can appear in different formats. Either,
 * GPSLatitude & GPSLongitude where the hemispheres (N, W, S, E) is a suffix on
 * the coordinates, or in a separate GPSLatitudeRef and GPSLongitudeRef
 * fields. This block handles both cases.
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

export { extractLatLngTz };

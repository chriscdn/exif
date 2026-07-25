// https://github.com/photostructure/tz-lookup
import tzlookup from "@photostructure/tz-lookup";

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

const extractLatLngTz = (
  exifReaderTags: ExifReader.ExpandedTags,
): LocationInfo => {
  return (
    _extractLatLngTzFromExif(exifReaderTags) ??
    _extractLatLngTzFromXmp(exifReaderTags) ?? {
      latitude: null,
      longitude: null,
      timeZone: null,
    }
  );
};

// ExifReader does us the favour of resolving the gps coordinates as decimal.
// This seems to only happen if the location is in the exif.
const _extractLatLngTzFromExif = (
  exifReaderTags: ExifReader.ExpandedTags,
): LocationInfo | null => {
  const latitude = toNumber(exifReaderTags.gps?.Latitude, {
    digits: 6,
    roundingMode: RoundingMode.ROUND,
  });

  const longitude = toNumber(exifReaderTags.gps?.Longitude, {
    digits: 6,
    roundingMode: RoundingMode.ROUND,
  });
  if (isNumber(latitude) && isNumber(longitude)) {
    const timeZone = tzlookup(latitude, longitude);
    return { latitude, longitude, timeZone };
  } else {
    return null;
  }
};

const _extractLatLngTzFromXmp = (
  exifReaderTags: ExifReader.ExpandedTags,
): LocationInfo | null => {
  let latString = exifReaderTags.xmp?.["GPSLatitude"]?.description as
    | string
    | undefined;

  let lonString = exifReaderTags.xmp?.["GPSLongitude"]?.description as
    | string
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
    }

    if (
      isString(lonString) &&
      (lonString.endsWith("W") || lonString.endsWith("E"))
    ) {
      westOrEast = lonString[lonString.length - 1] as "W" | "E";
      lonString = lonString.slice(0, -1);
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

      const timeZone = tzlookup(latitude, longitude);

      // https://en.wikipedia.org/wiki/Decimal_degrees
      return {
        latitude,
        longitude,
        timeZone,
      };
    }
  }

  return null;
};

export { extractLatLngTz };

// src/index.ts
import ExifReader from "exifreader";

// src/extraction.ts
import arrify from "arrify";

// src/utils.ts
import { toIntegerOrThrow } from "@chriscdn/to-number";
var isFile = (e) => typeof e !== "string";
var isString = (value) => typeof value === "string";
var getSizeInBrowser = async (file) => {
  return new Promise((resolve) => {
    const URL = window.URL || window.webkitURL;
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height
      });
    };
    image.src = URL.createObjectURL(file);
  });
};
var offsetStringToMinutes = (offset) => {
  const sign = offset.startsWith("-") ? -1 : 1;
  const [h, m] = offset.replace(/^[-+]/, "").split(":");
  const isUTC = h === "Z";
  const hours = isUTC ? 0 : toIntegerOrThrow(h);
  const minutes = isUTC ? 0 : toIntegerOrThrow(m);
  return sign * (hours * 60 + minutes);
};
var offsetStringToMilliseconds = (offset) => offsetStringToMinutes(offset) * 6e4;

// src/extraction.ts
import { toNumber } from "@chriscdn/to-number";
var extractTitle = (exifReaderTags) => {
  const title = exifReaderTags.iptc?.["Object Name"]?.description ?? exifReaderTags.xmp?.["title"]?.description;
  return title ? String(title).trim() : null;
};
var extractCaption = (exifReaderTags) => {
  const caption = exifReaderTags.exif?.["ImageDescription"]?.description ?? exifReaderTags.xmp?.["description"]?.description ?? exifReaderTags.iptc?.["Caption/Abstract"]?.description;
  return caption ? String(caption).trim() : null;
};
var extractKeywords = (exifReaderTags) => {
  return [
    ...new Set(
      [
        ...arrify(exifReaderTags.xmp?.["subject"]),
        ...arrify(exifReaderTags.iptc?.["Keywords"])
        // ...arrify(exifReaderTags["XPKeywords"]),
      ].filter(Boolean).map(
        (item) => typeof item === "object" ? item.description || "" : item
      ).flatMap((text) => text.split(/[;,]+/)).map((token) => token.trim().toLowerCase()).filter(Boolean)
    )
  ];
};
var extractHeightWidth = async (exifReaderTags, item) => {
  let width = toNumber(
    exifReaderTags.file?.["Image Width"]?.value ?? exifReaderTags.png?.["Image Width"]?.value ?? exifReaderTags.pngFile?.["Image Width"]?.value
  ) ?? 0;
  let height = toNumber(
    exifReaderTags.file?.["Image Height"]?.value ?? exifReaderTags.png?.["Image Height"]?.value ?? exifReaderTags.pngFile?.["Image Height"]?.value
  ) ?? 0;
  if (width > 0 && height > 0) {
  } else if (isString(item)) {
    const { nodeProbeImageSize } = await import("./node-image-size-HH6YCICQ.js");
    const results = await nodeProbeImageSize(item);
    width = results.width;
    height = results.height;
  } else if (window && isFile(item)) {
    const results = await getSizeInBrowser(item);
    width = results.width;
    height = results.height;
  } else {
  }
  return { width, height };
};

// src/extraction-datetime.ts
import {
  toDateInTimeZone,
  toDateUTC,
  isLocalTimeISO8601String
} from "@chriscdn/to-date";
import { formatDateYYYYMMDDTHHMMSS } from "@chriscdn/format-date";
import { toNumberOrThrow } from "@chriscdn/to-number";
var _isExifDateFormat = (dateStr) => /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr);
var _parseIsoDateTimeAndOffset = (isoString) => {
  const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}(?::?\d{2})?)$/;
  const match = isoString.match(regex);
  return {
    localTime: match?.[1] ?? null,
    offset: match?.[2] ?? null
  };
};
var _exifDateToISODate = (exifDateString) => {
  if (_isExifDateFormat(exifDateString)) {
    const [datePart, timePart] = exifDateString.split(" ");
    const dateSplit = datePart?.split(":") ?? [];
    const timeSplit = timePart?.split(":") ?? [];
    const year = toNumberOrThrow(dateSplit[0]);
    const month = toNumberOrThrow(dateSplit[1]);
    const day = toNumberOrThrow(dateSplit[2]);
    const hour = toNumberOrThrow(timeSplit[0]);
    const minute = toNumberOrThrow(timeSplit[1]);
    const seconds = toNumberOrThrow(timeSplit[2]);
    return {
      localTime: formatDateYYYYMMDDTHHMMSS(
        Date.UTC(year, month - 1, day, hour, minute, seconds),
        "UTC"
      ),
      offset: null
    };
  } else if (isLocalTimeISO8601String(exifDateString)) {
    return {
      localTime: exifDateString,
      offset: null
    };
  } else {
    return _parseIsoDateTimeAndOffset(exifDateString);
  }
};
var _extractLocalDateFromLocalTime = (localTime) => localTime?.split("T")[0] ?? null;
var _extractDateTimeFromString = (dateTimeOriginal, offsetTimeOriginal, timeZone) => {
  const { localTime, offset } = _exifDateToISODate(dateTimeOriginal);
  const offsetResolved = offsetTimeOriginal ?? offset;
  if (localTime) {
    const localDate = _extractLocalDateFromLocalTime(localTime);
    if (offsetResolved) {
      const utcDateTime = toDateUTC(localTime).getTime() - offsetStringToMilliseconds(offsetResolved);
      return {
        localTime,
        localDate,
        timestamp: utcDateTime
      };
    } else if (timeZone) {
      const dateTime = toDateInTimeZone(localTime, timeZone);
      return {
        localTime,
        localDate,
        timestamp: dateTime?.getTime() ?? null
      };
    } else {
      return {
        localTime,
        localDate,
        timestamp: null
      };
    }
  }
  return {
    localTime: null,
    localDate: null,
    timestamp: null
  };
};
var _extractDateTimeFromIPTC = (exifReaderTags) => {
  const datePart = exifReaderTags.iptc?.["Date Created"]?.description;
  const timePart = exifReaderTags.iptc?.["Time Created"]?.description;
  return datePart && timePart ? `${datePart}T${timePart}` : void 0;
};
var extractDateTime = (exifReaderTags, timeZone) => {
  const dateTimeOriginal = exifReaderTags.exif?.["DateTimeOriginal"]?.description ?? exifReaderTags.exif?.["DateTimeDigitized"]?.description ?? exifReaderTags.xmp?.["DateCreated"]?.description ?? _extractDateTimeFromIPTC(exifReaderTags);
  const offsetTimeOriginal = exifReaderTags.exif?.["OffsetTimeOriginal"]?.description ?? exifReaderTags.exif?.["OffsetTimeDigitized"]?.description;
  if (isString(dateTimeOriginal)) {
    return _extractDateTimeFromString(
      dateTimeOriginal,
      offsetTimeOriginal,
      timeZone
    );
  } else {
    return {
      localDate: null,
      localTime: null,
      timestamp: null
    };
  }
};

// src/index.ts
import { toNumber as toNumber3 } from "@chriscdn/to-number";

// src/extraction-location.ts
import tzlookup from "@photostructure/tz-lookup";
import { toNumber as toNumber2, RoundingMode, isNumber } from "@chriscdn/to-number";
var extractLatLngTz = (exifReaderTags) => {
  return _extractLatLngTzFromExif(exifReaderTags) ?? _extractLatLngTzFromXmp(exifReaderTags) ?? {
    latitude: null,
    longitude: null,
    timeZone: null
  };
};
var _extractLatLngTzFromExif = (exifReaderTags) => {
  const latitude = toNumber2(exifReaderTags.gps?.Latitude, {
    digits: 6,
    roundingMode: RoundingMode.ROUND
  });
  const longitude = toNumber2(exifReaderTags.gps?.Longitude, {
    digits: 6,
    roundingMode: RoundingMode.ROUND
  });
  if (isNumber(latitude) && isNumber(longitude)) {
    const timeZone = tzlookup(latitude, longitude);
    return { latitude, longitude, timeZone };
  } else {
    return null;
  }
};
var _extractLatLngTzFromXmp = (exifReaderTags) => {
  let latString = exifReaderTags.xmp?.["GPSLatitude"]?.description;
  let lonString = exifReaderTags.xmp?.["GPSLongitude"]?.description;
  if (latString && lonString) {
    let northOrSouth = null;
    let westOrEast = null;
    if (isString(latString) && (latString.endsWith("N") || latString.endsWith("S"))) {
      northOrSouth = latString[latString.length - 1];
      latString = latString.slice(0, -1);
    }
    if (isString(lonString) && (lonString.endsWith("W") || lonString.endsWith("E"))) {
      westOrEast = lonString[lonString.length - 1];
      lonString = lonString.slice(0, -1);
    }
    const latNumber = toNumber2(latString, {
      digits: 6,
      roundingMode: RoundingMode.ROUND
    });
    const lonNumber = toNumber2(lonString, {
      digits: 6,
      roundingMode: RoundingMode.ROUND
    });
    if (isNumber(latNumber) && isNumber(lonNumber) && isString(northOrSouth) && isString(westOrEast)) {
      const isSouthernHemsiphere = northOrSouth === "S";
      const isWesternHemisphere = westOrEast === "W";
      const latitudeFactor = isSouthernHemsiphere ? -1 : 1;
      const longitudeFactor = isWesternHemisphere ? -1 : 1;
      const latitude = latitudeFactor * latNumber;
      const longitude = longitudeFactor * lonNumber;
      const timeZone = tzlookup(latitude, longitude);
      return {
        latitude,
        longitude,
        timeZone
      };
    }
  }
  return null;
};

// src/index.ts
var exif = async (item) => {
  const _exif = {
    latitude: null,
    longitude: null,
    timeZone: null,
    localDate: null,
    localTime: null,
    timestamp: null,
    title: null,
    caption: null,
    width: 0,
    height: 0,
    city: null,
    state: null,
    location: null,
    country: null,
    countryCode: null,
    rating: null,
    mimetype: null,
    keywords: []
  };
  const exifReaderTags = await ExifReader.load(item, {
    expanded: true,
    includeTags: {
      exif: true,
      iptc: true,
      xmp: true,
      file: true,
      png: true,
      gps: true
    }
  });
  const locationInfo = extractLatLngTz(exifReaderTags);
  _exif.latitude = locationInfo.latitude;
  _exif.longitude = locationInfo.longitude;
  _exif.timeZone = locationInfo.timeZone;
  _exif.title = extractTitle(exifReaderTags);
  _exif.caption = extractCaption(exifReaderTags);
  _exif.city = exifReaderTags.xmp?.["City"]?.description ?? exifReaderTags.iptc?.["City"]?.description ?? null;
  _exif.state = exifReaderTags.xmp?.["State"]?.description ?? exifReaderTags.iptc?.["Province/State"]?.description ?? null;
  _exif.location = exifReaderTags.xmp?.["Location"]?.description ?? exifReaderTags.iptc?.["Sub-location"]?.description ?? null;
  _exif.countryCode = exifReaderTags.xmp?.["CountryCode"]?.description ?? exifReaderTags.iptc?.["Country/Primary Location Code"]?.description ?? null;
  _exif.country = exifReaderTags.xmp?.["Country"]?.description ?? exifReaderTags.iptc?.["Country/Primary Location Name"]?.description ?? null;
  _exif.mimetype = exifReaderTags.xmp?.["format"]?.description ?? null;
  _exif.rating = toNumber3(exifReaderTags.xmp?.["Rating"]?.value);
  _exif.keywords = extractKeywords(exifReaderTags);
  const dateTimeInfo = extractDateTime(exifReaderTags, locationInfo.timeZone);
  _exif.localDate = dateTimeInfo.localDate;
  _exif.localTime = dateTimeInfo.localTime;
  _exif.timestamp = dateTimeInfo.timestamp;
  const dimensionInfo = await extractHeightWidth(exifReaderTags, item);
  _exif.width = dimensionInfo.width;
  _exif.height = dimensionInfo.height;
  return _exif;
};
export {
  exif
};
//# sourceMappingURL=index.js.map
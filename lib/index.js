// src/index.ts
import pkg from "exifr";

// src/extraction.ts
import tzlookup from "@photostructure/tz-lookup";
import arrify from "arrify";
import { isNumber, RoundingMode, toNumber } from "@chriscdn/to-number";

// src/utils.ts
import { toIntegerOrThrow, toNumberOrThrow } from "@chriscdn/to-number";
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
var convertLatLonToDecimal = (coord) => {
  const match = coord?.match(/^(\d+),(\d+\.\d+)([NSWE])$/);
  if (match) {
    const [_, degreesStr, minutesStr, hemisphere] = match;
    const degrees = toIntegerOrThrow(degreesStr);
    const minutes = toNumberOrThrow(minutesStr);
    let decimal = degrees + minutes / 60;
    if (hemisphere === "S" || hemisphere === "W") {
      decimal *= -1;
    }
    return decimal;
  } else {
    return null;
  }
};

// src/extraction.ts
var extractTitle = (rawExif) => {
  const title = rawExif.title?.value ?? rawExif.ObjectName ?? null;
  return title ? String(title).trim() : null;
};
var extractCaption = (rawExif) => {
  const caption = rawExif.description?.value ?? rawExif.ImageDescription ?? rawExif.Caption ?? null;
  return caption ? String(caption).trim() : null;
};
var extractKeywords = (rawExif) => arrify(
  rawExif.Keywords ?? rawExif.subject ?? rawExif.weightedFlatSubject ?? []
);
var extractLatLngTz = (rawExif) => {
  const rawLatitude = rawExif.latitude;
  const rawLongitude = rawExif.longitude;
  const rawGpsLatitude = rawExif.GPSLatitude;
  const rawGpsLongitude = rawExif.GPSLongitude;
  const latitude = isNumber(rawLatitude) ? rawLatitude : isString(rawGpsLatitude) ? convertLatLonToDecimal(rawGpsLatitude) : null;
  const longitude = isNumber(rawLatitude) ? rawLongitude : isString(rawGpsLongitude) ? convertLatLonToDecimal(rawGpsLongitude) : null;
  const timeZone = isNumber(latitude) && isNumber(longitude) ? tzlookup(latitude, longitude) : null;
  return {
    latitude: toNumber(latitude, {
      digits: 6,
      roundingMode: RoundingMode.ROUND
    }),
    longitude: toNumber(longitude, {
      digits: 6,
      roundingMode: RoundingMode.ROUND
    }),
    timeZone
  };
};
var extractHeightWidth = async (rawExif, item) => {
  let width = toNumber(rawExif.ImageWidth) ?? toNumber(rawExif.ExifImageWidth) ?? 0;
  let height = toNumber(rawExif.ImageHeight) ?? toNumber(rawExif.ExifImageHeight) ?? 0;
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
import { isDate, toDate, toDateInTimeZone, toDateUTC } from "@chriscdn/to-date";
import { formatDateYYYYMMDDTHHMMSS } from "@chriscdn/format-date";
var extractDateTime = (rawExif, locationInfo) => {
  const dateTimeOriginal = rawExif.DateTimeOriginal ?? null;
  const offsetTimeOriginal = rawExif.OffsetTimeOriginal ?? null;
  if (isString(dateTimeOriginal)) {
    return _extractDateTimeFromString(dateTimeOriginal, locationInfo);
  } else if (isDate(dateTimeOriginal)) {
    const offsetInMinutes = offsetTimeOriginal ? offsetStringToMinutes(offsetTimeOriginal) : null;
    return _extractDateTimeFromDate(
      dateTimeOriginal,
      locationInfo,
      offsetInMinutes
    );
  } else {
    return {
      localDate: null,
      localTime: null,
      timestamp: null
    };
  }
};
var _extractLocalDateFromLocalTime = (localTime) => localTime?.split("T")[0] ?? null;
var _extractDateTimeFromString = (dateTimeOriginal, locationInfo) => {
  const correctDate = toDate(dateTimeOriginal);
  if (locationInfo.timeZone) {
    const localTime = formatDateYYYYMMDDTHHMMSS(
      correctDate,
      locationInfo.timeZone
    );
    return {
      localTime,
      localDate: _extractLocalDateFromLocalTime(localTime),
      timestamp: correctDate?.getTime() ?? null
    };
  } else {
    const localTime = dateTimeOriginal.slice(0, 19);
    return {
      // We want the *local time* for consistency, which we can get from dateTimeOriginal
      localTime,
      localDate: _extractLocalDateFromLocalTime(localTime),
      timestamp: correctDate?.getTime() ?? null
    };
  }
};
var _extractDateTimeFromDate = (dateTimeOriginal, locationInfo, offsetInMinutes) => {
  const localDateAsString = formatDateYYYYMMDDTHHMMSS(dateTimeOriginal);
  const localDate = _extractLocalDateFromLocalTime(localDateAsString);
  if (offsetInMinutes !== null) {
    const utcDate = toDateUTC(localDateAsString);
    if (utcDate) {
      utcDate?.setMinutes(utcDate.getUTCMinutes() - offsetInMinutes);
    }
    return {
      localTime: localDateAsString,
      timestamp: utcDate?.getTime() ?? null,
      localDate
    };
  } else if (locationInfo.timeZone) {
    const fixedDate = toDateInTimeZone(
      localDateAsString,
      locationInfo.timeZone
    );
    return {
      localTime: localDateAsString,
      timestamp: fixedDate?.getTime() ?? null,
      localDate
    };
  } else {
    return {
      localTime: localDateAsString,
      timestamp: null,
      localDate
    };
  }
};

// src/index.ts
var { parse } = pkg;
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
    country: null,
    countryCode: null,
    rating: null,
    mimetype: null,
    keywords: []
  };
  const data = await parse(item, true);
  const locationInfo = extractLatLngTz(data);
  _exif.latitude = locationInfo.latitude;
  _exif.longitude = locationInfo.longitude;
  _exif.timeZone = locationInfo.timeZone;
  _exif.title = extractTitle(data);
  _exif.caption = extractCaption(data);
  _exif.city = data.City;
  _exif.state = data.State;
  _exif.country = data.Country;
  _exif.countryCode = data.CountryCode;
  _exif.rating = data.Rating;
  _exif.mimetype = data.format;
  _exif.keywords = extractKeywords(data);
  const dateTimeInfo = extractDateTime(data, locationInfo);
  _exif.localTime = dateTimeInfo.localTime;
  _exif.timestamp = dateTimeInfo.timestamp;
  _exif.localDate = dateTimeInfo.localDate;
  const dimensionInfo = await extractHeightWidth(data, item);
  _exif.width = dimensionInfo.width;
  _exif.height = dimensionInfo.height;
  return _exif;
};
export {
  exif
};
//# sourceMappingURL=index.js.map
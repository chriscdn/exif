import { offsetStringToMinutes } from "./utils";
import { isDate, toDate, toDateInTimeZone, toDateUTC } from "@chriscdn/to-date";
import { formatDateYYYYMMDDTHHMMSS } from "@chriscdn/format-date";
import { DateTimeInfo, LocationInfo, RawExifData } from "./types";

const extractDateTime = (
  rawExif: RawExifData,
  locationInfo: LocationInfo,
): DateTimeInfo => {
  // The exifr lib returns a Date or string
  const dateTimeOriginal: string | Date | null =
    rawExif.DateTimeOriginal ?? null;

  const offsetTimeOriginal =
    (rawExif.OffsetTimeOriginal as string | undefined) ?? null;

  if (typeof dateTimeOriginal === "string") {
    return _extractDateTimeFromString(dateTimeOriginal, locationInfo);
  } else if (isDate(dateTimeOriginal)) {
    const offsetInMinutes = offsetTimeOriginal
      ? offsetStringToMinutes(offsetTimeOriginal)
      : null;

    return _extractDateTimeFromDate(
      dateTimeOriginal,
      locationInfo,
      offsetInMinutes,
    );
  } else {
    // null case
    return {
      localTime: null,
      timestamp: null,
    };
  }
};

/**
 * Handles case where dateTimeOriginal is a string with time zone information
 * embedded. Seen this with PNG files exported from Lightroom.
 */
const _extractDateTimeFromString = (
  dateTimeOriginal: string,
  locationInfo: LocationInfo,
) => {
  const correctDate = toDate(dateTimeOriginal);

  if (locationInfo.timeZone) {
    return {
      localTime: formatDateYYYYMMDDTHHMMSS(correctDate, locationInfo.timeZone),
      timestamp: correctDate?.getTime() ?? null,
      // timeZoneOffsetInMinutes: null,
    };
  } else {
    return {
      localTime: dateTimeOriginal.slice(0, 19),
      timestamp: correctDate?.getTime() ?? null,
      // timeZoneOffsetInMinutes: null,
    };
  }
};

/**
 * When exifr returns a date, it's incorrectly interprettd in the time zone of
 * the device. We correct it here.
 */
const _extractDateTimeFromDate = (
  dateTimeOriginal: Date,
  locationInfo: LocationInfo,
  offsetInMinutes: number | null,
): DateTimeInfo => {
  // parsed in device tz, so we format it back in same tz
  const localDateAsString = formatDateYYYYMMDDTHHMMSS(dateTimeOriginal);

  if (locationInfo.timeZone) {
    const fixedDate = toDateInTimeZone(
      localDateAsString,
      locationInfo.timeZone,
    );

    return {
      localTime: localDateAsString,
      timestamp: fixedDate?.getTime() ?? null,
      // timeZoneOffsetInMinutes: null,
    };
  } else if (offsetInMinutes !== null) {
    // Date S
    const utcDate = toDateUTC(localDateAsString);

    if (utcDate) {
      utcDate?.setMinutes(utcDate.getUTCMinutes() - offsetInMinutes);
    }

    return {
      localTime: localDateAsString,
      timestamp: utcDate?.getTime() ?? null,
    };
  } else {
    return {
      localTime: localDateAsString,
      timestamp: null,
    };
  }
};

export { extractDateTime };

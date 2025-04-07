import { offsetStringToMinutes } from "./utils";
import { isDate, toDate, toDateInTimeZone, toDateUTC } from "@chriscdn/to-date";
import { formatDateYYYYMMDDTHHMMSS } from "@chriscdn/format-date";
import { DateTimeInfo, LocationInfo, RawExifData } from "./types";

const extractDateTime = (
  rawExif: RawExifData,
  locationInfo: LocationInfo,
): DateTimeInfo => {
  // The exifr lib returns a Date or string
  const dateTimeOriginal: string | Date | null = rawExif.DateTimeOriginal ??
    null;

  const offsetTimeOriginal =
    (rawExif.OffsetTimeOriginal as string | undefined) ?? null;

  if (typeof dateTimeOriginal === "string") {
    // PNGs seem to go this way
    return _extractDateTimeFromString(dateTimeOriginal, locationInfo);
  } else if (isDate(dateTimeOriginal)) {
    // JPGs go this way
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
 * Exifr appears to return the DateTimeOriginal as a string with a time zone,
 * such as "2024-12-21T18:59:43-05:00", for PNG files—at least for those
 * exported from Lightroom.
 */
const _extractDateTimeFromString = (
  dateTimeOriginal: string,
  locationInfo: LocationInfo,
) => {
  // Dates with time zone (e.g., "2024-12-21T18:59:43-05:00") are parsed correctly.
  const correctDate = toDate(dateTimeOriginal);

  if (locationInfo.timeZone) {
    return {
      localTime: formatDateYYYYMMDDTHHMMSS(correctDate, locationInfo.timeZone),
      timestamp: correctDate?.getTime() ?? null,
    };
  } else {
    return {
      // We want the *local time* for consistency, which we can get from dateTimeOriginal
      localTime: dateTimeOriginal.slice(0, 19),
      timestamp: correctDate?.getTime() ?? null,
    };
  }
};

/**
 * When exifr returns a date, it's incorrectly interpreted in the time zone of
 * the device. We correct it here.
 */
const _extractDateTimeFromDate = (
  dateTimeOriginal: Date,
  locationInfo: LocationInfo,
  offsetInMinutes: number | null,
): DateTimeInfo => {
  // parsed in device tz, so we format it back in same tz
  const localDateAsString = formatDateYYYYMMDDTHHMMSS(dateTimeOriginal);

  // console.log(
  //   `${localDateAsString} - ${offsetInMinutes} - ${locationInfo.timeZone}`,
  // );

  if (offsetInMinutes !== null) {
    const utcDate = toDateUTC(localDateAsString);

    if (utcDate) {
      utcDate?.setMinutes(utcDate.getUTCMinutes() - offsetInMinutes);
    }

    return {
      localTime: localDateAsString,
      timestamp: utcDate?.getTime() ?? null,
    };
  } else if (locationInfo.timeZone) {
    const fixedDate = toDateInTimeZone(
      localDateAsString,
      locationInfo.timeZone,
    );

    return {
      localTime: localDateAsString,
      timestamp: fixedDate?.getTime() ?? null,
      // timeZoneOffsetInMinutes: null,
    };
  } else {
    return {
      localTime: localDateAsString,
      timestamp: null,
    };
  }
};

export { extractDateTime };

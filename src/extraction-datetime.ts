import { isString, offsetStringToMilliseconds } from "./utils";
import { toDateInTimeZone, toDateUTC } from "@chriscdn/to-date";
import { formatDateYYYYMMDDTHHMMSS } from "@chriscdn/format-date";
import { DateTimeInfo, LocationInfo } from "./types";
import { toNumberOrThrow } from "@chriscdn/to-number";

/**
 * Returns true if an old EXIF style date e.g., 2024:12:21 18:59:43
 *
 * @param dateStr
 * @returns
 */
const _isValidExifDateFormat = (dateStr: string): boolean =>
  /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr);

const _parseIsoDateTimeAndOffset = (isoString: string) => {
  // Captures local date-time, then optional 'Z' or [+-]HH[:]?MM offset
  const regex =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}(?::?\d{2})?)$/;
  const match = isoString.match(regex);

  return {
    localTime: match?.[1] ?? null,
    offset: match?.[2] ?? null,
  };
};

/**
 *
 * @param exifDateString
 * @returns
 */
const _exifDateToISODate = (
  exifDateString: string,
): { localTime: string | null; offset: string | null } => {
  if (_isValidExifDateFormat(exifDateString)) {
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
        "UTC",
      )!,
      offset: null,
    };
  } else {
    // assuming "2024-12-21T18:59:43-05:00"
    // console.log("NOW WHAT");

    return _parseIsoDateTimeAndOffset(exifDateString);
  }
};

const _extractLocalDateFromLocalTime = (localTime: string | null) =>
  localTime?.split("T")[0] ?? null;

const _extractDateTimeFromString = (
  dateTimeOriginal: string,
  offsetTimeOriginal: string | undefined,
  timeZone: LocationInfo["timeZone"],
) => {
  const { localTime, offset } = _exifDateToISODate(dateTimeOriginal);

  const offsetResolved = offsetTimeOriginal ?? offset;

  if (localTime) {
    const localDate = _extractLocalDateFromLocalTime(localTime);

    if (offsetResolved) {
      const utcDateTime =
        toDateUTC(localTime)!.getTime() -
        offsetStringToMilliseconds(offsetResolved);

      return {
        localTime,
        localDate,
        timestamp: utcDateTime,
      };
    } else if (timeZone) {
      const dateTime = toDateInTimeZone(localTime, timeZone);

      return {
        localTime,
        localDate,
        timestamp: dateTime?.getTime() ?? null,
      };
    } else {
      return {
        localTime,
        localDate,
        timestamp: null,
      };
    }
  }

  return {
    localTime: null,
    localDate: null,
    timestamp: null,
  };
};

const extractDateTime = (
  exifReaderTags: ExifReader.Tags,
  timeZone: LocationInfo["timeZone"],
): DateTimeInfo => {
  const dateTimeOriginal =
    exifReaderTags["DateTimeOriginal"]?.description ??
    exifReaderTags["DateTimeDigitized"]?.description ??
    exifReaderTags["DateCreated"]?.description;

  const offsetTimeOriginal =
    exifReaderTags["OffsetTimeOriginal"]?.description ??
    exifReaderTags["OffsetTimeDigitized"]?.description;

  if (isString(dateTimeOriginal)) {
    return _extractDateTimeFromString(
      dateTimeOriginal,
      offsetTimeOriginal,
      timeZone,
    );
  } else {
    return {
      localDate: null,
      localTime: null,
      timestamp: null,
    };
  }
};

export { extractDateTime };

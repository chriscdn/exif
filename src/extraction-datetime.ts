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
const isValidExifDateFormat = (dateStr: string): boolean =>
  /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr);

const parseIsoDateTimeAndOffset = (isoString: string) => {
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
const exifDateToISODate = (
  exifDateString: string,
): { localTime: string | null; offset: string | null } => {
  if (isValidExifDateFormat(exifDateString)) {
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

    return parseIsoDateTimeAndOffset(exifDateString);
  }
};

const extractDateTime = (
  exifReaderTags: ExifReader.Tags,
  timeZone: LocationInfo["timeZone"],
): DateTimeInfo => {
  // console.log("-----");
  // console.log(exifReaderTags.OffsetTimeOriginal?.description);
  // console.log(exifReaderTags.OffsetTimeDigitized?.description);
  // console.log("-----");

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

const _extractLocalDateFromLocalTime = (localTime: string | null) =>
  localTime?.split("T")[0] ?? null;

const _extractDateTimeFromString = (
  dateTimeOriginal: string,
  offsetTimeOriginal: string | undefined,
  timeZone: LocationInfo["timeZone"],
) => {
  const { localTime, offset } = exifDateToISODate(dateTimeOriginal);

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

/**
 * When exifr returns a date, it's incorrectly interpreted in the time zone of
 * the device. We correct it here.
 */
// const _extractDateTimeFromDate = (
//   dateTimeOriginal: Date,
//   locationInfo: LocationInfo,
//   offsetInMinutes: number | null,
// ): DateTimeInfo => {
//   // parsed in device tz, so we format it back in same tz
//   const localDateAsString = formatDateYYYYMMDDTHHMMSS(dateTimeOriginal);

//   const localDate = _extractLocalDateFromLocalTime(localDateAsString);

//   if (offsetInMinutes !== null) {
//     const utcDate = toDateUTC(localDateAsString);

//     if (utcDate) {
//       utcDate?.setMinutes(utcDate.getUTCMinutes() - offsetInMinutes);
//     }

//     return {
//       localTime: localDateAsString,
//       timestamp: utcDate?.getTime() ?? null,
//       localDate,
//     };
//   } else if (locationInfo.timeZone) {
//     const fixedDate = toDateInTimeZone(
//       localDateAsString,
//       locationInfo.timeZone,
//     );

//     return {
//       localTime: localDateAsString,
//       timestamp: fixedDate?.getTime() ?? null,
//       localDate,
//     };
//   } else {
//     return {
//       localTime: localDateAsString,
//       timestamp: null,
//       localDate,
//     };
//   }
// };

export { extractDateTime };

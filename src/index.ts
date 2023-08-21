import pkg from "exifr";
const { parse } = pkg;

import { DateTime } from "luxon";
import tzlookup from "tz-lookup";

export type TExifData = {
  latitude: number | null;
  longitude: number | null;
  timeZone: string | null;
  localTime: string | null; // e.g., 2023-01-01T09:45:64, relative to location
  timestamp: number | null; // in milliseconds
  timeZoneOffsetInMinutes: number | null;
  description: string | null;
  width: number;
  height: number;
  isPrecise: boolean;
};

// TS type guard
function isFile(e: File | string): e is File {
  return typeof e !== "string";
}

function isDate(value: unknown): value is Date {
  return (
    value instanceof Date ||
    (typeof value === "object" &&
      Object.prototype.toString.call(value) === "[object Date]")
  );
}

/**
 * A browser function for getting the width and height of an image.
 *
 * @param file {File}
 * @returns
 */
async function getSizeInBrowser(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const URL = window.URL || window.webkitURL;
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
      });
    };

    image.src = URL.createObjectURL(file);
  });
}

//
/**
 * Convert a time zone offset to minutes.  e.g., +02:00 => 120
 *
 * @param offset
 * @returns
 */

// from luxon
// Duration.fromISOTime('05:00').as('milliseconds'));
function offsetStringToMinutes(offset: string): number {
  const split = offset.split(":");
  const hours = parseInt(split[0]);
  const minutes = parseInt(split[1]);

  const factor = hours > 0 ? 1 : -1;

  return hours * 60 + factor * minutes;
}

const exif = async (item: File | string): Promise<TExifData> => {
  const _exif: TExifData = {
    latitude: null,
    longitude: null,
    timeZone: null,
    localTime: null,
    timestamp: null,
    timeZoneOffsetInMinutes: null,
    description: null,
    width: 0,
    height: 0,
    isPrecise: false,
  };

  const data = await parse(item, true);

  _exif.latitude = data.latitude ?? null; //    get(data, "latitude", null);
  _exif.longitude = data.longitude ?? null; // ; get(data, "longitude", null);

  if (_exif.latitude && _exif.longitude) {
    _exif.timeZone = tzlookup(_exif.latitude, _exif.longitude);
  }

  const imageDescription = data.ImageDescription ?? null;
  _exif.description = imageDescription ? String(imageDescription).trim() : null;

  // The exifr library gives us a Date object, but with the time zone of the
  // computer doing the parsing.  This is really bad, so we must adjust this to
  // get the correct time with the correct offset.
  //
  // https://github.com/MikeKovarik/exifr/issues/90

  // Sometimes exifr gives us a string here (e.g., with PNG files).

  const dateTimeOriginal: string | Date | null = data.DateTimeOriginal ?? null;

  // This is the offset of the DateTimeOriginal.  This seems to be present in
  // later versions of iOS, but older versions don't seem to have it.
  //
  // https://exiftool.org/TagNames/EXIF.html
  const offsetTimeOriginal: string | null = data.OffsetTimeOriginal ?? null;

  if (isDate(dateTimeOriginal)) {
    // DateTimeOriginal is constructed by exifr and assumes local (browser, OS)
    // time zone.  It's wrong.  We need to fix this.

    const zone: string | null = _exif.timeZone;

    const offsetInMinutes: number | null = offsetTimeOriginal
      ? -offsetStringToMinutes(offsetTimeOriginal)
      : null;

    _exif.isPrecise = Boolean(zone) || Boolean(offsetInMinutes);

    // DateTime is a luxon object.  The setZone function doesn't mutate the date
    // and time, unless keepLocalTime is true.  What this means: Use the
    // offsetInMinutes if we have it, otherwise, use the timeZone.  If neither
    // are present then we are out of luck, and the system timeZone will be
    // used.  An undefined zone implies the local time zone of the computer.

    const fixedDateTime = DateTime.utc(
      dateTimeOriginal.getFullYear(),
      dateTimeOriginal.getMonth() + 1,
      dateTimeOriginal.getDate(),
      dateTimeOriginal.getHours(),
      dateTimeOriginal.getMinutes(),
      dateTimeOriginal.getSeconds()
    )
      .plus({ minutes: offsetInMinutes ?? undefined })
      .setZone(zone ?? undefined, {
        keepLocalTime: offsetInMinutes === undefined,
      });

    _exif.timestamp = fixedDateTime.toMillis();

    // yes, negative, since we negated it earlier
    _exif.timeZoneOffsetInMinutes = offsetInMinutes
      ? -offsetInMinutes
      : fixedDateTime.offset;

    _exif.localTime = fixedDateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  }

  _exif.width = data.ExifImageWidth ?? null;
  _exif.height = data.ExifImageHeight ?? null;

  if (!_exif.width && !_exif.height) {
    // if we have a file path, on node.js
    if (typeof item === "string") {
      // This block is for node.js only.
      const { default: probe } = await import("probe-image-size");
      const results = await probe(item);

      if (results?.width && results?.height) {
        _exif.width = results.width;
        _exif.height = results.height;
      }
    } else if (window && isFile(item)) {
      const results = await getSizeInBrowser(item);

      _exif.width = results.width;
      _exif.height = results.height;
    } else {
      // out of luck
    }
  }
  return _exif;
};

export default exif;

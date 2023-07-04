import { parse } from "exifr";
import get from "lodash.get";
import { DateTime } from "luxon";
import tzlookup from "tz-lookup";
// e.g., +02:00 => 120
function offsetStringToMinutes(offset) {
    const split = offset.split(":");
    const hours = parseInt(split[0]);
    const minutes = parseInt(split[1]);
    const factor = hours > 0 ? 1 : -1;
    return hours * 60 + factor * minutes;
}
const exif = async (item) => {
    const data = await parse(item, true);
    const _exif = {};
    const latitude = get(data, "latitude");
    const longitude = get(data, "longitude");
    // The exifr library gives us a Date object, but with the time zone of the
    // computer doing the parsing.  This is really bad.  So we must adjust this to get the correct time.
    //
    // https://github.com/MikeKovarik/exifr/issues/90
    const dateTimeOriginal = get(data, "DateTimeOriginal");
    // This is the offset of the DateTimeOriginal.  This seems to be present in
    // later versions of iOS, but older versions don't seem to have it.
    //
    // https://exiftool.org/TagNames/EXIF.html
    const offsetTimeOriginal = get(data, "OffsetTimeOriginal", undefined);
    if (latitude && longitude) {
        _exif.latitude = latitude;
        _exif.longitude = longitude;
        _exif.timezone = tzlookup(latitude, longitude);
        _exif.description = String(get(data, "ImageDescription", "")).trim();
    }
    if (dateTimeOriginal) {
        // DateTimeOriginal is constructed by exifr and assumes local (browser, OS)
        // time zone.  It's wrong.  We need to fix this.
        const zone = _exif.timezone;
        const offsetInMinutes = offsetTimeOriginal
            ? -offsetStringToMinutes(offsetTimeOriginal)
            : undefined;
        // This is a luxon DateTime object.  The setZone function doesn't mutate the
        // date and time, unless keepLocalTime is true.  What this means: Use the
        // offsetInMinutes if we have it, otherwise, use the timeZone.  If neither
        // are present then we are out of luck, and the system timeZone will be
        // used.  An undefined zone implies the local time zone of the computer.
        const utcDateTime = DateTime.utc(dateTimeOriginal.getFullYear(), dateTimeOriginal.getMonth() + 1, dateTimeOriginal.getDate(), dateTimeOriginal.getHours(), dateTimeOriginal.getMinutes(), dateTimeOriginal.getSeconds());
        const fixedDateTime = utcDateTime
            .plus({ minutes: offsetInMinutes })
            .setZone(zone, { keepLocalTime: offsetInMinutes === undefined });
        _exif.timestamp = fixedDateTime.toMillis();
        // yes, negative, since we negated it earlier
        _exif.timeZoneOffsetInMinutes = offsetInMinutes
            ? -offsetInMinutes
            : undefined;
        _exif.local_time = fixedDateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    }
    _exif.width = get(data, "ExifImageWidth");
    _exif.height = get(data, "ExifImageHeight");
    if (typeof item === "string" && !_exif.width && !_exif.height) {
        // This block is for node.js only.  Browser, out of luck.
        const { default: probe } = await import("probe-image-size");
        const results = await probe(item);
        if (results?.width && results?.height) {
            _exif.width = results.width;
            _exif.height = results.height;
        }
    }
    return _exif;
};
export { exif };
//# sourceMappingURL=index.js.map
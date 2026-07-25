import ExifReader from "exifreader";

import {
  extractCaption,
  extractHeightWidth,
  extractKeywords,
  extractTitle,
} from "./extraction";

import type { ExifData, Source } from "./types";
import { extractDateTime } from "./extraction-datetime";
import { toNumber } from "@chriscdn/to-number";
import { extractLatLngTz } from "./extraction-location";

const exif = async (item: Source): Promise<ExifData> => {
  const _exif: ExifData = {
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
    keywords: [],
  };

  const exifReaderTags = await ExifReader.load(item, {
    expanded: true,
    includeTags: {
      exif: true,
      iptc: true,
      xmp: true,
      file: true,
      png: true,
      gps: true,
    },
  });

  // fs.writeFile("temp.json", JSON.stringify(exifReaderTags), "utf-8");
  // console.log(JSON.stringify(exifReaderTags));

  const locationInfo = extractLatLngTz(exifReaderTags);

  _exif.latitude = locationInfo.latitude;
  _exif.longitude = locationInfo.longitude;
  _exif.timeZone = locationInfo.timeZone;

  _exif.title = extractTitle(exifReaderTags);
  _exif.caption = extractCaption(exifReaderTags);

  _exif.city =
    exifReaderTags.xmp?.["City"]?.description ??
    exifReaderTags.iptc?.["City"]?.description ??
    null;

  _exif.state =
    exifReaderTags.xmp?.["State"]?.description ??
    exifReaderTags.iptc?.["Province/State"]?.description ??
    null;

  _exif.location =
    exifReaderTags.xmp?.["Location"]?.description ??
    exifReaderTags.iptc?.["Sub-location"]?.description ??
    null;

  _exif.countryCode =
    exifReaderTags.xmp?.["CountryCode"]?.description ??
    exifReaderTags.iptc?.["Country/Primary Location Code"]?.description ??
    null;

  _exif.country =
    exifReaderTags.xmp?.["Country"]?.description ??
    exifReaderTags.iptc?.["Country/Primary Location Name"]?.description ??
    null;

  _exif.mimetype = exifReaderTags.xmp?.["format"]?.description ?? null;

  _exif.rating = toNumber(exifReaderTags.xmp?.["Rating"]?.value);

  _exif.keywords = extractKeywords(exifReaderTags);

  // console.log(JSON.stringify(exifReaderTags));

  const dateTimeInfo = extractDateTime(exifReaderTags, locationInfo.timeZone);
  _exif.localDate = dateTimeInfo.localDate;
  _exif.localTime = dateTimeInfo.localTime;
  _exif.timestamp = dateTimeInfo.timestamp;

  const dimensionInfo = await extractHeightWidth(exifReaderTags, item);
  _exif.width = dimensionInfo.width;
  _exif.height = dimensionInfo.height;

  return _exif;
};

export { exif, type ExifData };

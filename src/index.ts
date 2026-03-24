// The import must be like this.
import pkg from "exifr";

const { parse } = pkg;

import {
  extractCaption,
  extractHeightWidth,
  extractKeywords,
  extractLatLngTz,
  extractTitle,
} from "./extraction";

import type { ExifData, Source } from "./types";

import { extractDateTime } from "./extraction-datetime";

const exif = async (item: Source): Promise<ExifData> => {
  const _exif: ExifData = {
    latitude: null,
    longitude: null,
    timeZone: null,
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
    keywords: [],
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

  const dimensionInfo = await extractHeightWidth(data, item);
  _exif.width = dimensionInfo.width;
  _exif.height = dimensionInfo.height;

  return _exif;
};

export { exif, type ExifData };

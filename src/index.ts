import pkg from "exifr";

import {
  extractDescription,
  extractHeightWidth,
  extractLatLngTz,
} from "./extraction";

import { type Source, type TExifData } from "./types";
import { extractDateTime } from "./extraction-datetime";

const { parse } = pkg;

const exif = async (item: Source): Promise<TExifData> => {
  const _exif: TExifData = {
    latitude: null,
    longitude: null,
    timeZone: null,
    localTime: null,
    timestamp: null,
    description: null,
    width: 0,
    height: 0,
    // isPrecise: false,
  };

  const data = await parse(item, true);

  // fs.promises.writeFile("./dump.json", JSON.stringify(data), "utf-8");

  const locationInfo = extractLatLngTz(data);

  _exif.latitude = locationInfo.latitude;
  _exif.longitude = locationInfo.longitude;
  _exif.timeZone = locationInfo.timeZone;
  _exif.description = extractDescription(data);

  const dateTimeInfo = extractDateTime(data, locationInfo);
  _exif.localTime = dateTimeInfo.localTime;
  _exif.timestamp = dateTimeInfo.timestamp;

  const dimensionInfo = await extractHeightWidth(data, item);
  _exif.width = dimensionInfo.width;
  _exif.height = dimensionInfo.height;

  return _exif;
};

export { exif, type TExifData };

import { DateTimeInfo, LocationInfo, RawExifData } from "./types";
declare const extractDateTime: (rawExif: RawExifData, locationInfo: LocationInfo) => DateTimeInfo;
export { extractDateTime };

export type Source = File | string;

export type RawExifData = any;

export type LocationInfo = Pick<
  TExifData,
  "latitude" | "longitude" | "timeZone"
>;

export type SizeInfo = Pick<TExifData, "width" | "height">;

export type DateTimeInfo = Pick<TExifData, "localTime" | "timestamp">;

export type TExifData = {
  latitude: number | null;
  longitude: number | null;
  timeZone: string | null;
  localTime: string | null; // e.g., 2023-01-01T09:45:64, relative to location
  timestamp: number | null; // in milliseconds
  //   timeZoneOffsetInMinutes: number | null;
  description: string | null;
  width: number;
  height: number;
  // isPrecise: boolean;
};

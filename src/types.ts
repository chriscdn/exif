type Source = File | string;

type LocationInfo = Pick<ExifData, "latitude" | "longitude" | "timeZone">;

type SizeInfo = Pick<ExifData, "width" | "height">;

type DateTimeInfo = Pick<ExifData, "localTime" | "timestamp" | "localDate">;

type ExifData = {
  latitude: number | null;
  longitude: number | null;
  timeZone: string | null;

  localDate: string | null; // e.g., 2023-01-01, relative to location
  localTime: string | null; // e.g., 2023-01-01T09:45:64, relative to location
  timestamp: number | null; // in milliseconds

  title: string | null;
  caption: string | null;
  width: number;
  height: number;

  city: string | null;
  state: string | null;
  location: string | null;
  countryCode: string | null;
  country: string | null;

  rating: number | null;
  mimetype: string | null;
  keywords: string[];
};

export type { Source, LocationInfo, SizeInfo, DateTimeInfo, ExifData };

export type Source = File | string;
export type RawExifData = any;
export type LocationInfo = Pick<TExifData, "latitude" | "longitude" | "timeZone">;
export type SizeInfo = Pick<TExifData, "width" | "height">;
export type DateTimeInfo = Pick<TExifData, "localTime" | "timestamp">;
export type TExifData = {
    latitude: number | null;
    longitude: number | null;
    timeZone: string | null;
    localTime: string | null;
    timestamp: number | null;
    description: string | null;
    width: number;
    height: number;
};

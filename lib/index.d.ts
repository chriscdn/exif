export type TExifData = {
    latitude: number | null;
    longitude: number | null;
    timeZone: string | null;
    localTime: string | null;
    timestamp: number | null;
    timeZoneOffsetInMinutes: number | null;
    description: string | null;
    width: number | null;
    height: number | null;
    isPrecise: boolean;
};
declare const exif: (item: File | string) => Promise<TExifData>;
export default exif;

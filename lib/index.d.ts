export type TExifData = {
    latitude?: number;
    longitude?: number;
    timezone?: string;
    local_time?: string;
    timestamp?: number;
    timeZoneOffsetInMinutes?: number;
    description?: string;
    width?: number;
    height?: number;
};
declare const exif: (item: File | string) => Promise<TExifData>;
export default exif;

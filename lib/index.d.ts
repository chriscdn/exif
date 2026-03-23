type Source = File | string;
type ExifData = {
    latitude: number | null;
    longitude: number | null;
    timeZone: string | null;
    localTime: string | null;
    timestamp: number | null;
    title: string | null;
    caption: string | null;
    width: number;
    height: number;
    city: string | null;
    state: string | null;
    countryCode: string | null;
    country: string | null;
    rating: number | null;
    mimetype: string | null;
    keywords: string[];
};

declare const exif: (item: Source) => Promise<ExifData>;

export { type ExifData, exif };

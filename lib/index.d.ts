import { type Source, type TExifData } from "./types";
declare const exif: (item: Source) => Promise<TExifData>;
export { exif, type TExifData };

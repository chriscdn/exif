# @chriscdn/exif

## Motivation

EXIF metadata can be inconsistent, particularly when it comes to timestamps and location data. Many images store dates in local time without specifying a time zone, making it difficult to determine exactly when a photo was taken.

This library, built on [exifr](https://github.com/MikeKovarik/exifr), extracts metadata from photos and **aims to normalize**:

- **Location** – Extracts GPS coordinates and identifies the time zone.
- **Date & Time** – Uses the time zone to determine the UTC time of the photo.
- **Dimensions** – Retrieves the image width and height.

Attemps are made to normalize the results from `exifr`, which can vary among image types.

**Note**: This package has only been tested with HEIC, PNG, and JPG files.

This package addresses a personal use case, but perhaps someone else will find it useful.

## Installation

Using npm:

```bash
npm install @chriscdn/exif
```

Using yarn:

```bash
yarn add @chriscdn/exif
```

## Usage

```ts
import { exif, type TExifData } from "@chriscdn/exif";

// Node.js
const image = "./path/to/file.jpg";
const data: TExifData = await exif(image);

// Browser
const file: File;
const data: TExifData = await exif(file);
```

## The `TExifData` return value

This is an opinionated return value which addresses my use case. Pull requests are welcome if you require other fields to be added.

- **`latitude`** (`number|null`): The latitude of the image's location in decimal degrees rounded to six significant digits. If the location is unknown, this value will be `null`.
- **`longitude`** (`number|null`): The longitude of the image's location in decimal degrees rounded to six significant digits. If the location is unknown, this value will be `null`.
- **`timeZone`** (`string|null`): The time zone of the location where the image was taken, which is evaluated from the `latitude` and `longitude`. If the time zone is unavailable, this will be `null`.
- **`localTime`** (`string|null`): The local time when the image was taken (relative to the specified `timeZone`), formatted as an ISO 8601 string (e.g., `"2023-01-01T09:45:64"`). If the local time is unavailable, this value will be `null`.
- **`timestamp`** (`number|null`): The Unix timestamp (in milliseconds) representing when the image was taken. If the timestamp is unavailable, this will be `null`.
- **`description`** (`string|null`): A description or caption of the image, if available. If no description is provided, this will be `null`.
- **`width`** (`number`): The width of the image in pixels.
- **`height`** (`number`): The height of the image in pixels.

## Notes

The library aims to standardize differences in `exifr`'s output between JPG and PNG files, based on the variations observed in my tests with files exported from Lightroom. Additionally, it addresses [this bug](https://github.com/MikeKovarik/exifr/pull/99) by correcting the date using the time zone or `OffsetTimeOriginal` value, if either is available.

Further testing is needed for PNGs from other sources.

## License

[MIT](LICENSE)

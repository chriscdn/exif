# @chriscdn/exif

## Motivation

EXIF metadata can be inconsistent, particularly when it comes to timestamps and location data. Many images store dates in local time without specifying a time zone, making it difficult to determine precisely when a photo was taken.

This library, built on [exifreader](https://npmjs.com/package/exifreader), extracts metadata from photos and **aims to normalize**:

- **Location** – Extracts GPS coordinates and identifies the time zone.
- **Date & Time** – Uses the time zone to determine the UTC time of the photo.
- **Dimensions** – Retrieves the image width and height.

Attempts are made to normalize the results from `exifr`, which can vary among image types.

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
import { exif, type ExifData } from "@chriscdn/exif";

// Node.js
const image = "./path/to/file.jpg";
const data: ExifData = await exif(image);

// Browser
const file: File;
const data: ExifData = await exif(file);
```

## The `ExifData` return value

This is an opinionated return value which addresses my use case. Pull requests are welcome if you require other fields to be added.

Fields are `null` when the data isn't available.

- **`latitude`** (`number|null`): Decimal degrees, rounded to 6 significant digits.
- **`longitude`** (`number|null`): Decimal degrees, rounded to 6 significant digits.
- **`timeZone`** (`string|null`): Time zone derived from `latitude`/`longitude`.
- **`localTime`** (`string|null`): ISO 8601 **local time** (e.g., `"2023-01-01T09:45:64"`).
- **`timestamp`** (`number|null`): Unix timestamp in milliseconds.
- **`title`** (`string|null`): Image title.
- **`caption`** (`string|null`): Image description.
- **`width`** (`number`): Image width in pixels.
- **`height`** (`number`): Image height in pixels.
- **`city`** (`string|null`): City where taken.
- **`state`** (`string|null`): State or region where taken.
- **`country`** (`string|null`): Country where taken.
- **`countryCode`** (`string|null`): ISO country code.
- **`location`** (`string|null`): Location.
- **`subLocation`** (`string|null`): Sub-location.
- **`rating`** (`number|null`): Numeric rating.
- **`mimetype`** (`string|null`): MIME type (e.g., `image/jpeg`).
- **`keywords`** (`string[]`): Associated tags; empty array if none.

## License

[MIT](LICENSE)

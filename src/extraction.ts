import arrify from "arrify";
import { getSizeInBrowser, isFile, isString } from "./utils";
import { SizeInfo, Source } from "./types";
import { toNumber } from "@chriscdn/to-number";

/**
 *
 * @param exifReaderTags {ExifReader.Tags}
 * @returns
 */
const extractTitle = (exifReaderTags: ExifReader.ExpandedTags) => {
  const title =
    exifReaderTags.iptc?.["Object Name"]?.description ??
    exifReaderTags.xmp?.["title"]?.description;

  return title ? String(title).trim() : null;
};

/**
 *
 * @param exifReaderTags {ExifReader.Tags}
 * @returns
 */
const extractCaption = (exifReaderTags: ExifReader.ExpandedTags) => {
  const caption =
    exifReaderTags.exif?.["ImageDescription"]?.description ??
    exifReaderTags.xmp?.["description"]?.description ??
    exifReaderTags.iptc?.["Caption/Abstract"]?.description;

  return caption ? String(caption).trim() : null;
};

const extractKeywords = (exifReaderTags: ExifReader.ExpandedTags): string[] => {
  return [
    ...new Set(
      [
        ...arrify(exifReaderTags.xmp?.["subject"]),
        ...arrify(exifReaderTags.iptc?.["Keywords"]),
        // ...arrify(exifReaderTags["XPKeywords"]),
      ]
        // Filter out null or undefined tag entries up front
        .filter(Boolean)
        // Normalize objects and strings into a flat string array
        .map((item) =>
          typeof item === "object" ? item.description || "" : item,
        )
        // Split comma/semicolon delimited blocks (common in legacy IPTC/Windows tags)
        .flatMap((text) => text.split(/[;,]+/))
        // Clean up whitespace and normalize casing
        .map((token) => token.trim().toLowerCase())
        // Remove empty strings created by the splitting process
        .filter(Boolean),
    ),
  ];
};

/**
 *
 * @param exifReaderTags {ExifReader.Tags}
 * @param item
 * @returns
 */
const extractHeightWidth = async (
  exifReaderTags: ExifReader.ExpandedTags,
  item: Source,
): Promise<SizeInfo> => {
  let width =
    toNumber(
      exifReaderTags.file?.["Image Width"]?.value ??
        exifReaderTags.png?.["Image Width"]?.value ??
        exifReaderTags.pngFile?.["Image Width"]?.value,
    ) ?? 0;

  let height =
    toNumber(
      exifReaderTags.file?.["Image Height"]?.value ??
        exifReaderTags.png?.["Image Height"]?.value ??
        exifReaderTags.pngFile?.["Image Height"]?.value,
    ) ?? 0;

  if (width > 0 && height > 0) {
    // great!
  } else if (isString(item)) {
    const { nodeProbeImageSize } = await import("./node-image-size");

    const results = await nodeProbeImageSize(item);

    width = results.width;
    height = results.height;
  } else if (window && isFile(item)) {
    const results = await getSizeInBrowser(item);

    width = results.width;
    height = results.height;
  } else {
    // out of luck
  }

  return { width, height };
};

export { extractCaption, extractHeightWidth, extractKeywords, extractTitle };

// import { resolve } from "path";
import { exif } from "../src";

// const image =
//   "/Users/chris/Desktop/Lightroom Exports/20241230-161751-001 (NIKON D7100).jpg";

// const image =
//   "/Volumes/Lightroom/Lightroom Library/Archive/2024/[2024-12] Christmas in Canada/2024-12-30-161751(NIKON D7100)-9940.JPG";

// const image =
//   "/Users/chris/Development/github/exif/__tests__/assets/cn_tower.metadata.png";

// const image =
//   "/Users/chris/Desktop/Lightroom Exports/20260719-122739-001 (iPhone 13 mini).jpg";

const image =
  "/Users/chris/Desktop/Lightroom Exports/[2026-07-23] 194137(iPhone 13 mini).tif";

// const image =
//   "/Users/chris/Development/github/exif/__tests__/assets/train_station.iphone4.jpg";

const data = await exif(image);

console.log(data);

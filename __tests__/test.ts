// import { resolve } from "path";
import { exif } from "../src";

const image =
  "/Users/chris/Development/github/exif/__tests__/assets/speakers_corner.jpg";
const data = await exif(image);

console.log(data);

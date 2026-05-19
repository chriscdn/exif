// import { resolve } from "path";
import { exif } from "../src";

const image = "/Users/chris/Development/github/exif/__tests__/assets/braga.jpg";
const data = await exif(image);

console.log(data);

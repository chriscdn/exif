// src/node-image-size.ts
import probe from "probe-image-size";
import fs from "fs";
var nodeProbeImageSize = async (filePath) => {
  const results = await probe(fs.createReadStream(filePath));
  return {
    width: results.width ?? 0,
    height: results.height ?? 0
  };
};
export {
  nodeProbeImageSize
};
//# sourceMappingURL=node-image-size-HH6YCICQ.js.map
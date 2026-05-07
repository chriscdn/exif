import probe from "probe-image-size";
import fs from "node:fs";

const nodeProbeImageSize = async (filePath: string) => {
  const results = await probe(fs.createReadStream(filePath));

  return {
    width: results.width ?? 0,
    height: results.height ?? 0,
  };
};

export { nodeProbeImageSize };

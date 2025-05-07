import { describe, expect, it } from "vitest";
import { exif, type TExifData } from "../src/index";
import { resolve } from "path";

const metadata: Record<string, Partial<TExifData>> = {
  cn_tower: {
    latitude: 43.642956,
    longitude: -79.383881,
    timeZone: "America/Toronto",
    localTime: "2024-12-21T18:59:43",
    timestamp: 1734825583000,
    caption: null,
    width: 225,
    height: 300,
  },
  tower_bridge: {
    latitude: 51.508417,
    longitude: -0.078391,
    localTime: "2024-10-08T09:19:54",
    caption: null,
    timeZone: "Europe/London",
    timestamp: 1728375594000,
    height: 1184,
    width: 1776,
  },
  train_station: {
    latitude: 47.049833,
    longitude: 8.31,
    localTime: "2013-08-29T20:12:59",
    caption: null,
    timeZone: "Europe/Zurich",
    timestamp: 1377799979000,
    height: 1936,
    width: 2592,
  },
};

describe("CN Tower - HEIC - Original File from Photos app", async () => {
  const image = resolve(__dirname, "./assets/cn_tower.original.heic");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.cn_tower,
      width: 4032,
      height: 3024,
    }));
  });
});

describe("CN Tower - Lightroom Export - JPG - Full Metadata", async () => {
  const image = resolve(__dirname, "./assets/cn_tower.metadata.jpg");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.cn_tower,
    }));
  });
});

describe("CN Tower - Lightroom Export - JPG - Full Metadata - No Location", async () => {
  const image = resolve(
    __dirname,
    "./assets/cn_tower.metadata.no_location.jpg",
  );
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.cn_tower,
      latitude: null,
      longitude: null,
      timeZone: null,
    }));
  });
});

describe("CN Tower - Lightroom Export - JPG - No Metadata", async () => {
  const image = resolve(__dirname, "./assets/cn_tower.no_metadata.jpg");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.cn_tower,
      latitude: null,
      longitude: null,
      timeZone: null,
      localTime: null,
      timestamp: null,
      caption: null,
    }));
  });
});

/** PNG */

describe("CN Tower - Lightroom Export - PNG - Full Metadata", async () => {
  const image = resolve(__dirname, "./assets/cn_tower.metadata.png");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining(metadata.cn_tower));
  });
});

describe("CN Tower - Lightroom Export - PNG - Full Metadata - No Location", async () => {
  const image = resolve(
    __dirname,
    "./assets/cn_tower.metadata.no_location.png",
  );
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.cn_tower,
      latitude: null,
      longitude: null,
      timeZone: null,
    }));
  });
});

describe("CN Tower - Lightroom Export - PNG - No Metadata", async () => {
  const image = resolve(__dirname, "./assets/cn_tower.no_metadata.png");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.cn_tower,
      latitude: null,
      longitude: null,
      timeZone: null,
      localTime: null,
      timestamp: null,
      caption: null,
    }));
  });
});

describe("London Tower Bridge - Fujfilm JPG", async () => {
  const image = resolve(__dirname, "./assets/tower_bridge.jpg");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.tower_bridge,
    }));
  });
});

describe("Luzern Train Station - iPhone 4 JPG", async () => {
  const image = resolve(__dirname, "./assets/train_station.iphone4.jpg");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      ...metadata.train_station,
    }));
  });
});

describe("iPhone 13mini Screenshot", async () => {
  const image = resolve(__dirname, "./assets/iphone_screenshot.png");
  const data = await exif(image);

  it("Metadata Comparison", () => {
    expect(data).toEqual(expect.objectContaining({
      latitude: null,
      longitude: null,
      localTime: "2025-03-16T11:57:13",
      timestamp: null,
      caption: null,
      timeZone: null,
      height: 2436,
      width: 1125,
    }));
  });
});

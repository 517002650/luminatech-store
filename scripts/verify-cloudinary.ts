import { v2 as cloudinary } from "cloudinary";
import { fetchAssetResponse } from "../src/lib/asset-delivery";

async function main() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const ping = await cloudinary.api.ping();
  console.log("ping", ping);

  const url =
    "https://res.cloudinary.com/tvv56z0q/raw/upload/v1787619246/luminatech/downloads/1787619246345-7e9700a8-_.zip";
  try {
    const res = await fetchAssetResponse(url);
    console.log(
      "download",
      res.status,
      res.headers.get("content-type"),
      res.headers.get("content-length"),
    );
  } catch (err) {
    console.error("download_err", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

void main();

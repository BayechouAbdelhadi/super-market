import type { MetadataRoute } from "next";
import { PUBLIC_MANIFEST } from "@/lib/seo/manifests";

/** Web app manifest: name and icons when the site is added to a phone's home screen. Colors follow the theme. */
export default function manifest(): MetadataRoute.Manifest {
  return PUBLIC_MANIFEST;
}

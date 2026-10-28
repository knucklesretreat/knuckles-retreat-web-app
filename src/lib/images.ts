import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

// Imported images are proxies: reading any property marks the original file as used, and Astro then
// ships it (multi-MB sources) next to the optimized versions. Read metadata from the clone instead,
// as Astro's own getImage() does.
export function metadataOf(src: ImageMetadata): ImageMetadata {
  return (src as ImageMetadata & { clone?: ImageMetadata }).clone ?? src;
}

// Qwik's `?url` image imports weren't the original files: vite-imagetools re-saved them with sharp's
// defaults (same format, quality 80, metadata stripped; .jpg became .jpeg). Reproduce that so the
// served bytes stay identical.
export async function reencodedUrl(src: ImageMetadata): Promise<string> {
  const { format } = metadataOf(src);
  const image = await getImage({ src, format: format === "jpg" ? "jpeg" : format, quality: 80 });
  return image.src;
}

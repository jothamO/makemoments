/**
 * Client-side image-to-WebP converter using the Canvas API.
 * 2026 best practice: convert images at the browser before upload
 * to reduce bandwidth and serve optimized formats.
 */

/**
 * Converts an image File to WebP format using OffscreenCanvas (or fallback Canvas).
 * Returns a new File object with `.webp` extension and `image/webp` MIME type.
 *
 * @param file - The source image file (PNG, JPEG, GIF, etc.)
 * @param quality - WebP quality (0-1). Default: 0.85 (good balance of size vs quality)
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
    // Skip if already WebP
    if (file.type === "image/webp") return file;

    // Skip non-image files
    if (!file.type.startsWith("image/")) return file;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    resolve(file); // Fallback to original
                    return;
                }

                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (!blob) {
                            resolve(file); // Fallback to original
                            return;
                        }

                        // Create new File with .webp extension
                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        const webpFile = new File([blob], `${baseName}.webp`, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        });

                        resolve(webpFile);
                    },
                    "image/webp",
                    quality
                );
            } catch {
                URL.revokeObjectURL(url);
                resolve(file); // Fallback to original on any error
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = url;
    });
}

/**
 * Batch convert multiple files to WebP.
 * Returns an array of { original, converted, saved } for reporting.
 */
export async function batchConvertToWebP(
    files: File[],
    quality = 0.85
): Promise<{ file: File; originalSize: number; savedBytes: number }[]> {
    const results = [];
    for (const file of files) {
        const originalSize = file.size;
        const converted = await convertToWebP(file, quality);
        results.push({
            file: converted,
            originalSize,
            savedBytes: originalSize - converted.size,
        });
    }
    return results;
}

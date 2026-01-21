/**
 * Compresses and resizes an image file.
 * @param file The image file to compress
 * @param maxWidth The maximum width of the output image (default: 1024px)
 * @param quality The quality of the output JPEG image (0 to 1, default: 0.8)
 * @returns A promise that resolves to the compressed image as a base64 string
 */
export const compressImage = (
    file: File,
    maxWidth: number = 1024,
    quality: number = 0.8
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64
                // Using image/jpeg for better compression, unless it's a PNG with transparency
                // ideally we might check the file type, but JPEG is safe for most photos
                const fileType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                // Note: quality parameter only works for image/jpeg and image/webp

                const base64 = canvas.toDataURL(fileType, quality);
                resolve(base64);
            };

            img.onerror = (error) => {
                reject(error);
            };
        };

        reader.onerror = (error) => {
            reject(error);
        };
    });
};

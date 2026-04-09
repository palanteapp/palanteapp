export const removeWhiteBackground = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Chroma Key: Target White (240-255)
            const threshold = 240;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // If pixel is "white enough", make it transparent
                if (r > threshold && g > threshold && b > threshold) {
                    data[i + 3] = 0; // Alpha = 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };

        img.onerror = (err) => {
            console.error("Image cleanup failed", err);
            // Fallback to original if processing fails
            resolve(imageSrc);
        };
    });
};

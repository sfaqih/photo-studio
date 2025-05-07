export function getMeta (url) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight, src: img.src });
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image at ${url}`));
        };

        img.src = url;
    });
};

export function loadHtmlImage (url) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
        img.crossOrigin = 'anonymous'; // Handle CORS if needed
    })
};

export const displayTemplateWidth = 500;

export function displayTemplateHeight (width, height) {
    const ratio = width / height;
    return Number(displayTemplateWidth / ratio);
};
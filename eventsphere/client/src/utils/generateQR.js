/**
 * Generates a client-side QR Code image URL using a free QR API
 * @param {String} text - Text to encode in the QR code
 * @param {Number} size - Dimensions (width/height) of QR code
 * @returns {String} - Image source URL
 */
export const generateQR = (text, size = 250) => {
  if (!text) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=0f172a&bgcolor=ffffff`;
};

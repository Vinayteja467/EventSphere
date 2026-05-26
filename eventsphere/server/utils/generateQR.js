import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      color: {
        dark: '#0f172a',  // Dark slate
        light: '#ffffff'  // White background
      },
      width: 300,
      margin: 2
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

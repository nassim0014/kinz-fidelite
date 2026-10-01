import QRCode from 'qrcode';

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#20411E', light: '#FFFFFF' },
  });
}

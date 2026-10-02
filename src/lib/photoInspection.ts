/** Inspect bounded file bytes before a browser allocates decoded pixels. */
export const PHOTO_DIMENSIONS = { maxPixels: 40_000_000, maxSide: 16_384, outputSide: 1920 } as const;
type Dimensions = { width: number; height: number };
const invalid = () => new Error('Файлът не е валидна JPEG, PNG или WebP снимка.');

export function inspectPhotoBytes(bytes: Uint8Array, declaredType: string): Dimensions {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length));
  let size: Dimensions | undefined;
  if (declaredType === 'image/png' && bytes.length >= 33 &&
      [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value) &&
      view.getUint32(8) === 13 && ascii(12, 4) === 'IHDR') {
    size = { width: view.getUint32(16), height: view.getUint32(20) };
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      if (length > bytes.length - offset - 12) throw invalid();
      if (ascii(offset + 4, 4) === 'acTL') throw new Error('Избери неподвижна снимка, без анимация.');
      offset += length + 12;
    }
  } else if (declaredType === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) throw invalid();
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) throw invalid();
      const length = view.getUint16(offset);
      if (length < 2 || length > bytes.length - offset) throw invalid();
      if (marker >= 192 && marker <= 207 && ![196,200,204].includes(marker)) {
        if (length < 8) throw invalid();
        size = { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
        break;
      }
      offset += length;
    }
  } else if (declaredType === 'image/webp' && bytes.length >= 20 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    if (view.getUint32(4, true) !== bytes.length - 8) throw invalid();
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const chunk = ascii(offset, 4), length = view.getUint32(offset + 4, true), start = offset + 8;
      if (length > bytes.length - start) throw invalid();
      if (chunk === 'ANIM' || chunk === 'ANMF' || (chunk === 'VP8X' && (bytes[start] & 2))) throw new Error('Избери неподвижна снимка, без анимация.');
      if (chunk === 'VP8X' && length >= 10) {
        const uint24 = (i: number) => bytes[i] + bytes[i + 1] * 256 + bytes[i + 2] * 65536;
        size = { width: uint24(start + 4) + 1, height: uint24(start + 7) + 1 };
      } else if (chunk === 'VP8 ' && length >= 10 && !(bytes[start] & 1) && bytes[start + 3] === 157 && bytes[start + 4] === 1 && bytes[start + 5] === 42) {
        const frame = { width: view.getUint16(start + 6, true) & 0x3fff, height: view.getUint16(start + 8, true) & 0x3fff };
        if (size && (frame.width !== size.width || frame.height !== size.height)) throw invalid();
        size = frame;
      } else if (chunk === 'VP8L' && length >= 5 && bytes[start] === 47) {
        const bits = view.getUint32(start + 1, true);
        const frame = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
        if (size && (frame.width !== size.width || frame.height !== size.height)) throw invalid();
        size = frame;
      }
      offset = start + length + (length % 2);
    }
  }
  if (!size || !size.width || !size.height) throw invalid();
  if (size.width > PHOTO_DIMENSIONS.maxSide || size.height > PHOTO_DIMENSIONS.maxSide || size.width * size.height > PHOTO_DIMENSIONS.maxPixels) {
    throw new Error('Снимката е над 40 мегапиксела или с твърде голяма страна. Избери по-малък размер.');
  }
  return size;
}

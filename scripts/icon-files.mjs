import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ICO directory entries wrap PNG images in the standard ICO container.
export function encodeIco(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  for (const [index, { size, png }] of entries.entries()) {
    if (size < 1 || size > 256 || !png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      throw new Error('Expected a PNG icon sized 1–256 pixels');
    }
    const at = 6 + index * 16;
    header[at] = size === 256 ? 0 : size;
    header[at + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries.map((entry) => entry.png)]);
}

export function writeIconFiles(root, images) {
  const ico = encodeIco([16, 32, 48].map((size) => ({ size, png: images.get(size) })));
  const files = new Map([
    ['favicon.ico', ico],
    ['mc-favicon.ico', ico],
    ['favicon.png', images.get(32)],
    ['mc-favicon-32.png', images.get(32)],
    ['icon-192.png', images.get(192)],
    ['mc-icon-192.png', images.get(192)],
    ['apple-touch-icon.png', images.get(180)],
    ['mc-apple-touch-icon.png', images.get(180)],
  ]);
  for (const [name, data] of files) writeFileSync(join(root, 'public', name), data);
}

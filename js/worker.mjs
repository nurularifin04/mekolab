import jsQR from '../lib/jsqr/jsQR.mjs';
import pako from '../lib/pako/pako.esm.mjs';
import qrcode from '../lib/qrcode/qrcode.mjs';
import { state } from './state.js';

//import encodeQR from '../lib/paulmiller/index.js';
//import decodeQR from '../lib/paulmiller/decode.js';
//import { Bitmap } from '../lib/paulmiller/index.js';

//import { char2Code, code2Char } from './convert.js';

//import pako from 'https://unpkg.com/pako@2.1.0/dist/pako.esm.mjs';
//import qrcode from 'https://unpkg.com/qrcode-generator@2.0.4/dist/qrcode.mjs';

const cvs = new OffscreenCanvas(10, 10);
const ctx = cvs.getContext('2d', { willReadFrequently: true });

const decode = (bitmap) => {
  cvs.width = bitmap.width;
  cvs.height = bitmap.height;
  ctx.drawImage(bitmap, 0, 0, cvs.width, cvs.height);
  const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  bitmap.close();
  return code.binaryData;
}
/*
const pmQR = (bitmap) => {
  cvs.width = bitmap.width;
  cvs.height = bitmap.height;
  ctx.drawImage(bitmap, 0, 0, cvs.width, cvs.height);
  const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
  const result = decodeQR(imageData);
  bitmap.close();
  return result;
}
*/
self.onmessage = (e) => {
  const { cmd, msg } = e.data;
  let result;
  
  if (cmd === 'JSQR') result = decode(msg);
  else if (cmd === 'INFLATE') result = pako.inflate(msg);
  else if (cmd === 'DEFLATE') result = pako.deflate(msg);
  
  const transferList = result.buffer ? [result.buffer] : [];
  self.postMessage(result, transferList);
}

self.onerror = (err) => self.postMessage(err);

/*
function generateQR(info, blocks) {
  const version = () => {
    const maxId = blocks.reduce((max, block) => Math.max(max, block[0]), 0);
    if (maxId > 52) return 3;
    else if (maxId > 48) return 2;
    else return 1;
  }
  
  const SIGNATURE = [19, 13, 252];
  
  const level = new Uint8Array([
    info.titleBytes.length,
    ...info.titleBytes,
    info.authorBytes.length,
    ...info.authorBytes,
    ...blocks.flat()
  ]);
  
  const binary = [version, ...SIGNATURE, ...pako.deflate(level)];
  
  const qr = qrcode(0, 'L');
  qr.addData(String.fromCharCode(...binary));
  qr.make();
  
  const module = qr.getModuleCount();
  const cellSize = 4;
  const qrSize = (2 * cellSize) + (module * cellSize);
  const cvs = new OffscreenCanvas(qrSize, qrSize);
  const ctx = cvs.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.save();
  ctx.translate(cellSize, cellSize);
  qr.renderTo2dContext(ctx, cellSize);
  ctx.restore();
  
  const blob = cvs.convertToBlob();
  return blob;
}
*/
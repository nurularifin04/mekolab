import { char2Code, code2Char } from "./convert.mjs";
import { runWorker } from "./worker-client.mjs";
//import { state } from './state.js';

import C from "./constants.mjs";

import {
  atlas,
  fontRules,
  mekoBlocks,
  orientationRules,
  poseTemplates,
} from "./blocks.ml2.mjs";

export class Decode {
  constructor(binary) {
    this.binary = binary;
    this.title = "";
    this.author = "";
    this.blocks = new Uint8Array(3 * C.D3);
  }

  static async create(imgElement) {
    const bitmap = await createImageBitmap(imgElement);

    if (bitmap.width === 0 || bitmap.height === 0) {
      throw new Error("Invalid image dimension.");
    }

    const binary = await runWorker({ cmd: "JSQR", msg: bitmap }, [bitmap]);

    if (!binary) throw new Error("Failed to decode QR Code.");

    // Header check
    const h8 = new Uint8Array(binary.slice(0, 4));
    const h32 = new Uint32Array(h8.buffer);
    const isHeader = C.HEADER.includes(h32[0]);

    if (!isHeader) throw new Error("This is not mekorama data.");

    // Create Instance Decode.
    const instance = new Decode(binary);
    await instance.parsing();
    return instance;
  }

  async parsing() {
    // Decompress using "pako.js" library.
    const level = await runWorker({
      cmd: "INFLATE",
      msg: this.binary.slice(4),
    });

    // Get level title.
    let index = 0;
    const titleLength = level[index++];
    const title = level.slice(index, index + titleLength);
    this.title = code2Char(title);

    // Get author name.
    index += titleLength;
    const authorLength = level[index++];
    const author = level.slice(index, index + authorLength);
    this.author = code2Char(author);

    // Get block values.
    index += authorLength;
    const blocks = Array.from(level.slice(index));

    for (let i = 0; i < this.blocks.length; i += 3) {
      this.blocks[i] = blocks.shift();
      const mb = mekoBlocks[this.blocks[i]];
      if (mb.type & 1) this.blocks[i + 1] = blocks.shift();
      if (mb.type & 2) this.blocks[i + 2] = blocks.shift();
    }
  }
}

export class Encode {
  constructor(blocks) {
    this.blocks = blocks;
    this.encoding();
    this.qrGenerate();
  }

  qrGenerate() {
    // Generate QR Code using "qrcode.js" library.
    const typeNumber = 0;
    const errorCorrectionLevel = "L";
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(String.fromCharCode(...this.code));
    qr.make();

    const module = qr.getModuleCount();
    const maxModule = 177; /** QR version 40 **/
    const maxCell = 4;
    const qrsize = maxModule * maxCell;
    const cell = Math.round(qrsize / module);
    const margin = maxModule;
    const cvsw = qrsize + 2 * margin;
    const cvsh = qrsize + 4 * margin;
    const cvs = new OffscreenCanvas(cvsw, cvsh);
    const ctx = cvs.getContext("2d");
    ctx.save();
    ctx.translate(margin, margin);
    qr.renderTo2dContext(ctx, cell);
    ctx.restore();

    const title = this.titleInput.value;
    const titleX = margin;
    const titleY = cvsw;

    const author = this.authorInput.value;
    const authorX = margin;
    const authorY = cvsw + margin;

    const fontSize = margin / 2;
    ctx.fillStyle = "black";
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(title, titleX, titleY);
    ctx.fillText(author, authorX, authorY);

    /*
    // Render QR Code to Canvas.
    const moduleCount = qr.getModuleCount();
    const moduleSize = 4;
    const padding = 50;
    const qrsize = (moduleCount * moduleSize) + (2 * padding);
    const [qrcvs, qrctx] = createCanvas(qrsize, qrsize, 'white');
    qrctx.save();
    qrctx.translate(padding, padding);
    qr.renderTo2dContext(qrctx, moduleSize);
    qrctx.restore();
    
    const margin = 64;
    const fontSize = 40;
    const lineHeight = 54;
    const cardWidth = 732;
    const cardHeight = cardWidth + (3 * lineHeight);
    const qrarea = cardWidth - (2 * margin);
    const [ccvs, cctx] = createCanvas(cardWidth, cardHeight, 'white');
    cctx.drawImage(qrcvs, margin, margin, qrarea, qrarea);

    // Adding Level info.
    const title = this.titleInput.value;
    const titleX = margin;
    const titleY = cardHeight - margin - lineHeight;
    
    const author = this.authorInput.value;
    const authorX = margin;
    const authorY = cardHeight - margin;
    
    cctx.fillStyle = 'black';
    cctx.font = `${fontSize}px Arial`;
    cctx.fillText(title, titleX, titleY);
    cctx.fillText(author, authorX, authorY);
    */
    // Append New QR Code Image to DOM.
    const cc = document.querySelector(".card-collector");
    const img = new Image();
    img.src = cvs.toDataURL();
    img.name = this.titleInput.value + ".png";
    img.className = "card";
    cc.appendChild(img);
  }

  encoding() {
    const header = this.setHeader();

    this.titleInput = document.querySelector("#title-input");
    const title = char2Code(this.titleInput.value.slice(0, 16));

    this.authorInput = document.querySelector("#author-input");
    const author = char2Code(this.authorInput.value.slice(0, 16));

    const blocks = this.blocks.flat();
    const level = new Uint8Array([
      title.length,
      ...title,
      author.length,
      ...author,
      ...blocks,
    ]);

    // Compress using "pako.js" library.
    this.code = [...header, ...pako.deflate(level)];
  }

  setHeader() {
    //const maxId = Math.max(...this.blocks.map(block => block[0]));
    const maxId = this.blocks.reduce(
      (max, block) => Math.max(max, block[0]),
      0,
    );

    // Mekorama header format: [x, 19, 13, 252].
    let header = [19, 13, 252];
    if (maxId > 52) {
      header.unshift(3);
    } else if (maxId > 48) {
      header.unshift(2);
    } else {
      header.unshift(1);
    }
    return header;
  }
}

export class Transform {
  constructor() {
    this.rotated = [];
    this.translated = [];
    this.newrot = new Uint8Array(3 * C.D3).fill(0);
  }
  /**
   * Convert index to coordinates.
   * @param {number} index - Index array.
   */
  static index2Coords(index) {
    const x = index % C.D1;
    const y = Math.floor((index % C.D2) / C.D1);
    const z = Math.floor(index / C.D2);
    return { x, y, z };
  }
  /**
   * Convert coordinates to index.
   * @param {number} x, y, z - Coordinate value.
   */
  static coords2Index(x, y, z) {
    return x + y * C.D1 + z * C.D2;
  }
  /**
   * Transposes the coordinate properties (x, y, z) in-place.
   * @param {object} coords - The coordinate object {x: val1, y: val2, z: val3}.
   * @param {string} xKey - The property key providing the new value for 'coords.x'.
   * @param {string} yKey - The property key providing the new value for 'coords.y'.
   * @param {string} zKey - The property key providing the new value for 'coords.z'.
   */
  transpose(coords, xKey, yKey, zKey) {
    const oldValues = [coords[xKey], coords[yKey], coords[zKey]];

    [coords.x, coords.y, coords.z] = oldValues;
  }
  /**
   * Reverse coordinates order.
   * @param {object} coords - Coordinate x, y, z.
   * @param {string} axis - Coords properties (select coord to reverse).
   */
  reverse(coords, axis) {
    coords[axis] = C.D1 - 1 - coords[axis];
  }
  /**
   * Rotating blocks in 3D.
   * @param {object} blocks - Array 1D.
   * @param {string} axis - Rotate at axis 'x' / 'y' / 'z'.
   * @param {boolean} isClockwise - Rotate direction.
   */
  newrotate(blocks, axis, isClockwise) {
    this.newrot.fill(0);
    const orientationSets = {
      x: [
        [0, 4, 8, 12],
        [2, 14, 10, 6],
        [1, 17, 11, 21],
        [3, 23, 9, 19],
        [5, 18, 15, 20],
        [7, 22, 13, 16],
      ],
      y: [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15],
        [16, 17, 18, 19],
        [20, 21, 22, 23],
      ],
      z: [
        [0, 16, 10, 20],
        [1, 13, 9, 5],
        [2, 22, 8, 18],
        [3, 7, 11, 15],
        [4, 17, 14, 23],
        [6, 21, 12, 19],
      ],
    };

    for (let i = 0; i < blocks.length; i += 3) {
      if (blocks[i] === 0) continue;

      const coords = Transform.index2Coords(i / 3);
      const mb = mekoBlocks[blocks[i]];

      if (axis === "x") {
        this.transpose(coords, "x", "z", "y");
        const reverseAxis = isClockwise ? "z" : "y";
        this.reverse(coords, reverseAxis);
      } else if (axis === "y") {
        this.transpose(coords, "z", "y", "x");
        const reverseAxis = isClockwise ? "x" : "z";
        this.reverse(coords, reverseAxis);
      } else if (axis === "z") {
        this.transpose(coords, "y", "x", "z");
        const reverseAxis = isClockwise ? "y" : "x";
        this.reverse(coords, reverseAxis);
      } else return;

      const index = 3 * Transform.coords2Index(coords.x, coords.y, coords.z);
      this.newrot[index] = blocks[i];
      this.newrot[index + 2] = blocks[i + 2];

      if (mb.type & 1) {
        const orient = blocks[i + 1];
        const orientSet = orientationSets[axis].find((set) =>
          set.includes(orient),
        );
        const currentIndex = orientSet.indexOf(orient);
        const newIndex = isClockwise
          ? (currentIndex - 1 + 4) % 4
          : (currentIndex + 1) % 4;
        this.newrot[index + 1] = orientSet[newIndex];
      }
    }
  }

  rotate(blocks, axis, isClockwise) {
    const orientationSets = {
      x: [
        [0, 4, 8, 12],
        [2, 14, 10, 6],
        [1, 17, 11, 21],
        [3, 23, 9, 19],
        [5, 18, 15, 20],
        [7, 22, 13, 16],
      ],
      y: [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15],
        [16, 17, 18, 19],
        [20, 21, 22, 23],
      ],
      z: [
        [0, 16, 10, 20],
        [1, 13, 9, 5],
        [2, 22, 8, 18],
        [3, 7, 11, 15],
        [4, 17, 14, 23],
        [6, 21, 12, 19],
      ],
    };

    const newBlocks = Array(4096).fill([0]);
    blocks.forEach((val, idx) => {
      const newVal = [...val];
      if (newVal[0] === 0) return;
      const coords = Transform.index2Coords(idx);
      const mb = mekoBlocks[newVal[0]];

      if (axis === "x") {
        this.transpose(coords, "x", "z", "y");
        const reverseAxis = isClockwise ? "z" : "y";
        this.reverse(coords, reverseAxis);
      } else if (axis === "y") {
        this.transpose(coords, "z", "y", "x");
        const reverseAxis = isClockwise ? "x" : "z";
        this.reverse(coords, reverseAxis);
      } else if (axis === "z") {
        this.transpose(coords, "y", "x", "z");
        const reverseAxis = isClockwise ? "y" : "x";
        this.reverse(coords, reverseAxis);
      } else return;

      if (mb.type & 1) {
        const orient = newVal[1];
        const orientSet = orientationSets[axis].find((set) =>
          set.includes(orient),
        );
        const currentIndex = orientSet.indexOf(orient);
        const newIndex = isClockwise
          ? (currentIndex - 1 + 4) % 4
          : (currentIndex + 1) % 4;
        newVal[1] = orientSet[newIndex];
      }

      const index = Transform.coords2Index(coords.x, coords.y, coords.z);
      newBlocks[index] = newVal;
    });
    this.rotated = newBlocks;
  }
  /**
   * Translate blocks in 3D.
   * @param {object} blocks - Array 1D.
   * @param {string} axis - Translate at axis 'x' / 'y' / 'z'.
   * @param {number} move - Signed integer.
   */
  newtl(blocks, axis, move) {
    this.newrot.fill(0);

    for (let i = 0; i < blocks.length; i += 3) {
      if (blocks[i] === 0) continue;
      const coords = Transform.index2Coords(i / 3);
      coords[axis] = (coords[axis] + move) % C.D1;

      const index = 3 * Transform.coords2Index(coords.x, coords.y, coords.z);
      this.newrot[index] = blocks[i];
      this.newrot[index + 1] = blocks[i + 1];
      this.newrot[index + 2] = blocks[i + 2];
    }
  }

  translate(blocks, axis, move) {
    const newBlocks = Array(4096).fill([0]);
    blocks.forEach((val, idx) => {
      if (val[0] === 0) return;
      const coords = Transform.index2Coords(idx);
      coords[axis] = (coords[axis] + move) % 16;

      const index = Transform.coords2Index(coords.x, coords.y, coords.z);
      newBlocks[index] = val;
    });
    this.translated = newBlocks;
  }
}

export class Render {
  static drawTile(ctx, value, coords, idx, blocks) {
    const [ID, ORIENT, FONT] = value;
    const mb = mekoBlocks[ID];

    const val = blocks.slice(idx, idx + 2);

    if (ID === 0) return;

    if (mb.type === 0) {
      const sx = mb.startX * C.TILE;
      const sy = mb.startY * C.TILE;
      const dx = 0;
      const dy = 0;

      let height = C.TILE;

      if (ID === 27 && blocks[idx - 16 * 3] === 0) {
        height *= 2;
      } else {
      }

      ctx.drawImage(atlas, sx, sy, C.TILE, height, dx, dy, C.TILE, height);
    } else if (mb.type === 1) {
      const rule = orientationRules[mb.rule];
      const index = rule[ORIENT][0];
      const transform = rule[ORIENT][1];

      let sx = (mb.startX + (index % mb.cols)) * C.TILE;
      let sy = (mb.startY + Math.floor(index / mb.cols)) * C.TILE;

      if (ID === 29) sy = 0;

      let tl = C.TILE / 2;
      let dx = -tl;
      let dy = -tl;
      let [angle, scaleX, scaleY] = poseTemplates[transform];

      ctx.save();
      ctx.translate(tl, tl);
      ctx.rotate(angle);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(atlas, sx, sy, C.TILE, C.TILE, dx, dy, C.TILE, C.TILE);
      ctx.restore();
    } else if (mb.type === 2) {
      const rule = fontRules[mb.rule];
      const index = rule[FONT];

      const sx = (mb.startX + (index % mb.cols)) * C.TILE;
      const sy = (mb.startY + Math.floor(index / mb.cols)) * C.TILE;
      const dx = 0;
      const dy = 0;

      ctx.drawImage(atlas, sx, sy, C.TILE, C.TILE, dx, dy, C.TILE, C.TILE);
    } else if (mb.type === 3) {
      const rule = orientationRules[mb.rule];
      const index = rule[ORIENT][0];
      const transform = rule[ORIENT][1];

      const sx = (mb.startX + (index % mb.cols)) * C.TILE;
      const sy = (mb.startY + Math.floor(index / mb.cols)) * C.TILE;
      const dx = 0;
      const dy = 0;

      ctx.drawImage(atlas, sx, sy, C.TILE, C.TILE, dx, dy, C.TILE, C.TILE);

      // Attach Font
      if ([59, 60].includes(ID)) return;
      if (![2, 8, 18, 22].includes(ORIENT)) return;

      const ruleFont = fontRules[1];
      const indexFont = ruleFont[FONT];

      let startX = 0;
      let startY = 14;
      if (ID === 67) startY = 12;

      const fontSize = C.TILE / 2;
      const offset = fontSize / 2;

      const fsx = offset + (startX + (indexFont % 32)) * C.TILE;
      const fsy = offset + (startY + Math.floor(indexFont / 32)) * C.TILE;
      const fdx = -offset - 1;
      const fdy = -offset - 1;
      const angle = poseTemplates[transform][0];

      ctx.save();
      ctx.translate(fontSize, fontSize);
      ctx.rotate(angle);
      ctx.drawImage(
        atlas,
        fsx,
        fsy,
        fontSize,
        fontSize,
        fdx,
        fdy,
        fontSize + 2,
        fontSize + 2,
      );
      ctx.restore();
    }
  }

  static drawCheck(ctx) {
    for (let y = 0; y < C.D1; y += 1) {
      for (let x = 0; x < C.D1; x += 1) {
        let color = "#eee";
        if (x % 2 !== y % 2) continue;

        ctx.save();
        ctx.fillStyle = color;
        ctx.translate(C.TILE, C.TILE);
        ctx.fillRect(x * C.TILE, y * C.TILE, C.TILE, C.TILE);
        ctx.restore();
      }
    }

    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 4;
    //ctx.setLineDash([20, 20]);
    ctx.strokeRect(C.TILE, C.TILE, C.D1 * C.TILE, C.D1 * C.TILE);
  }

  static drawAll(ctx, blocks) {
    this.drawCheck(ctx);
    for (let i = 0; i < blocks.length; i += 3) {
      const val = blocks.slice(i, i + 2);
      const { x, y, z } = Transform.index2Coords(i / 3);

      //if (z !== 0) return;

      const dx = x * C.TILE;
      const dy = (C.D1 - 1 - y) * C.TILE;

      ctx.save();
      ctx.translate(dx + C.TILE, dy + C.TILE);
      this.drawTile(ctx, val, { x, y, z }, i, blocks);
      ctx.restore();
    }
  }
}

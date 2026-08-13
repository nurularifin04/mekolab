import { char2Code, code2Char } from "./convert.js";
import { atlas, mekoBlocks } from "./blocks.ml2.js";
import { runWorker } from "./worker-client.mjs";

export class Decode {
  constructor(binary) {
    this.binary = binary;
    this.title = "";
    this.author = "";
    this.blocks = [];
  }

  static async create(imgElement) {
    const bitmap = await createImageBitmap(imgElement);

    if (bitmap.width === 0 || bitmap.height === 0) {
      throw new Error("Invalid image dimension.");
    }

    const binary = await runWorker({ id: "JSQR", bitmap: bitmap }, [bitmap]);

    if (!binary) throw new Error("Failed to decode QR Code.");

    // Header check
    const version = binary[0];
    const signature = binary.slice(1, 4);
    const isHeader =
      [1, 2, 3].includes(version) && signature.join(".") === "19.13.252";

    if (!isHeader) throw new Error("This is not mekorama data.");

    // Create Instance Decode.
    const instance = new Decode(binary);
    await instance.parsing();
    return instance;
  }

  async parsing() {
    // Decompress using "pako.js" library.
    const level = await runWorker({ id: "INFLATE", msg: this.binary.slice(4) });

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
    const flatBlocks = Array.from(level.slice(index));
    this.blocks = this.attributeAssignment(flatBlocks);
  }

  attributeAssignment(flatBlocks) {
    const blockSets = [];
    let idx = 0;
    while (idx < flatBlocks.length) {
      const id = flatBlocks[idx];
      const block = mekoBlocks[id];

      if (block.type === 3) {
        blockSets.push([id, flatBlocks[idx + 1], flatBlocks[idx + 2]]);
        idx += 3;
      } else if (block.type === 2 || block.type === 1) {
        blockSets.push([id, flatBlocks[idx + 1]]);
        idx += 2;
      } else {
        blockSets.push([id]);
        idx += 1;
      }
    }
    return blockSets;
  }
}

//import Modal from './modal.js';
import { initMain } from "./main-page.mjs";
import { initEdit } from "./edit-page.mjs";
import { mekoBlocks } from "./blocks.ml2.mjs";

//document.addEventListener('DOMContentLoaded', initMain(), initEdit());

const bblocks = new Uint8Array([4, 66, 7, 0, 5, 2, 0, 67, 6, 8]);
const blocks = Array.from(bblocks);
const slot = new Uint8Array(3 * 6);
const nblocks = [];

function spread() {
  for (let i = 0; i < slot.length; i += 3) {
    slot[i] = blocks.shift();

    const mb = mekoBlocks[slot[i]];
    if (mb.type & 1) slot[i + 1] = blocks.shift();
    if (mb.type & 2) slot[i + 2] = blocks.shift();
  }
}

function shrink() {
  for (let i = 0; i < slot.length; i += 3) {
    nblocks.push(slot[i]);

    const mb = mekoBlocks[slot[i]];
    if (mb.type & 1) nblocks.push(slot[i + 1]);
    if (mb.type & 2) nblocks.push(slot[i + 2]);
  }
}

spread();
shrink();

const a = new Uint8ClampedArray([1, 19, 13, 252, 255, 255, 255, 255]);
const b = new Uint32Array(a.buffer);
//alert(b[0] === 0xFC0D1301);
const c = new Uint32Array(a.slice(0, 4).buffer);
const d = [];
const e = new Uint8Array(c.buffer);
d.push(...e);
const g = c[0] >> 0xff;
const f = new Uint8Array(c.buffer);
d.push(...f);

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Selesai dimuat!");

  try {
    initMain();
    alert("initMain berhasil dijalankan");
  } catch (error) {
    alert("Error di initMain:", error);
  }

  try {
    initEdit();
    alert("initEdit berhasil dijalankan");
  } catch (error) {
    alert("Error di initEdit:", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  alert("DOM Selesai dimuat!");
});

import { state } from "./state.mjs";
import { Decode, Render, Transform } from "./processor.ml2.mjs";
import { mekoBlocks, atlas } from "./blocks.ml2.mjs";

import C from "./constants.mjs";
const translateBtn = document.querySelector("#geser");

const cvs = document.querySelector("#cvs");
cvs.width = 18 * 64;
cvs.height = 18 * 64;
const ctx = cvs.getContext("2d");

const handlerProxy = {
  set: (target, property, value) => {
    const success = Reflect.set(target, property, value);

    if (success && property < target.length) {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      Render.drawAll(ctx, target);
    } else {
      alert(success);
    }
    return success;
  },
};

const proxy = new Proxy(state.blocks, handlerProxy);

export const initEdit = () => {
  const mainPage = document.querySelector(".main-page");
  const editPage = document.querySelector(".edit-page");
  const rotateBtn = document.querySelector("#rotate");
  const closeBtn = document.querySelector("#tutup");
  const tf = new Transform();

  cvs.addEventListener("click", (e) => {
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX - 64;
    const clickY = (e.clientY - rect.top) * scaleY - 64;

    const col = Math.floor(clickX / 64);
    const row = 16 - 1 - Math.floor(clickY / 64);

    addMode(col, row);
  });

  function addMode(x, y) {
    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
      for (let z = C.D1 - 1; z >= 0; z -= 1) {
        const currentIdx = 3 * Transform.coords2Index(x, y, z);
        const beforeZIdx = 3 * Transform.coords2Index(x, y, z - 1);
        //alert(`${z} > ${state.blocks[index]}`)
        if (state.blocks[currentIdx] === 0) {
          if (state.blocks[beforeZIdx] !== 0 || z === 0) {
            proxy[currentIdx] = 15;
            const ID = Render.neighbors({ x, y, z }, state.blocks);
            const name = ID !== null ? mekoBlocks[ID].name : "no name";
            alert(name);
            return;
          }
        }
        //ctx.clearRect(0, 0, cvs.width, cvs.height);
        //Render.drawAll(ctx, state.blocks);
      }
    }
  }

  closeBtn.addEventListener("click", () => {
    editPage.classList.remove("open");
  });

  rotateBtn.addEventListener("click", () => {
    tf.newrotate(state.blocks, "y", true);
    tf.newrot.forEach((val, idx) => (state.blocks[idx] = val));

    //ctx.clearRect(0, 0, cvs.width, cvs.height);
    //Render.drawAll(ctx, state.blocks);
  });

  translateBtn.addEventListener("click", () => {
    tf.newtl(state.blocks, "x", 1);
    //tf.newrot.forEach((val, idx) => state.blocks[idx] = val);

    //ctx.clearRect(0, 0, cvs.width, cvs.height);
    //Render.drawAll(ctx, state.blocks);
  });

  const ic = document.querySelector(".input-container");
  const bvc = document.querySelector(".block-group");
  const ovc = document.querySelector(".orient-group");
  const fvc = document.querySelector(".font-group");

  (function initValue() {
    for (let i = 0; i < mekoBlocks.length; i += 1) {
      const block = document.createElement("input");
      const mb = mekoBlocks[i];

      if (i === 0) block.checked = true;

      block.type = "radio";
      block.name = "block-group";
      block.value = i;
      block.className = "bval";

      bvc.appendChild(block);
    }

    for (let i = 0; i < 24; i += 1) {
      const orient = document.createElement("input");
      const mb = mekoBlocks[i];

      if (i === 0) orient.checked = true;

      orient.type = "radio";
      orient.name = "orient-group";
      orient.value = i;
      orient.className = "oval";

      ovc.appendChild(orient);
    }

    for (let i = 0; i < C.D2; i += 1) {
      const font = document.createElement("input");
      const mb = mekoBlocks[i];

      if (i === 0) font.checked = true;

      font.type = "radio";
      font.name = "font-group";
      font.value = i;
      font.className = "fval";

      fvc.appendChild(font);
    }
  })();

  bvc.addEventListener("click", (e) => {
    const input = e.target.closest("input");

    if (!input) return;

    const mb = mekoBlocks[parseInt(input.value)];

    state.value[0] = parseInt(input.value);

    if (mb.type & 1) {
      bvc.classList.add("hidden");
      ovc.classList.remove("hidden");
    } else if (mb.type & 2) {
      bvc.classList.add("hidden");
      fvc.classList.remove("hidden");
    }

    state.replace(3 * 4095);

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    Render.drawAll(ctx, state.blocks);
  });

  ovc.addEventListener("click", (e) => {
    const input = e.target.closest("input");

    if (!input) return;

    const mb = mekoBlocks[state.value[0]];

    state.value[1] = parseInt(input.value);

    state.replace(3 * 4095);

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    Render.drawAll(ctx, state.blocks);

    if (mb.type & 2) {
      ovc.classList.add("hidden");
      fvc.classList.remove("hidden");
    } else {
      ovc.children[0].checked = true;
      state.value[1] = 0;
      bvc.classList.remove("hidden");
      ovc.classList.add("hidden");
    }
  });

  fvc.addEventListener("click", (e) => {
    const input = e.target.closest("input");

    if (!input) return;

    const mb = mekoBlocks[state.value[0]];

    state.value[2] = parseInt(input.value);

    bvc.classList.remove("hidden");
    fvc.classList.add("hidden");

    state.replace(3 * 4095);

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    Render.drawAll(ctx, state.blocks);

    ovc.children[0].checked = true;
    fvc.children[0].checked = true;
    state.value[1] = 0;
    state.value[2] = 0;
  });

  const opLayerBtn = document.querySelector("#open-layer-checkbox");
  const layer = document.querySelector(".layer-checkbox");

  (function initLayerCheckbox() {
    for (let i = 0; i < C.D1; i += 1) {
      const checkbox = document.createElement("input");
      const label = document.createElement("label");

      checkbox.type = "checkbox";
      checkbox.id = i;
      checkbox.value = i;
      checkbox.textContent = `Layer ${i + 1}`;

      layer.appendChild(checkbox);
    }
  })();

  opLayerBtn.addEventListener("click", () => {
    /*
    layer.classList.contains('open')
    ? layer.classList.remove('open')
    : layer.classList.add('open');
    */

    for (let i = 0; i < 1000; i += 3) {
      proxy[i] = 50;
    }

    alert("s");
  });
};

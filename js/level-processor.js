
import { ui } from "./ui-elements.js";
import { show, hide, bytesToText, attributeAssignment, createCanvas } from "./utils.js";

let mekoBlocks;
let blockId;

// Decoding QR Code
function jsqrDecode(image) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  /*
  const size = 218;
  const [cvs, ctx] = createCanvas(size, size);
  ctx.drawImage(image, 370, 662, size, size, 0, 0, size, size);
  ui.image.container.style = "background-color: #ddd;"
  ui.image.container.append(cvs)
  */
  const bagi = 1;
  const [cvs, ctx] = createCanvas(width / bagi, height / bagi);
  ctx.drawImage(image, 0, 0, width, height, 0, 0, width / bagi, height / bagi)
  
  const data = ctx.getImageData(0, 0, width / bagi, height / bagi);
  const imageData = data.data;
  //alert((width / bagi) -2)
  
  const code = jsQR(imageData, width / bagi, height / bagi);
  
  if (!code) {
    alert("gagal")
  }
  
  //codeProcess(code.version, code.location)
  //const result = new Uint8Array([...code.binaryData])
  
  
  const levelData = pako.inflate(code.binaryData.slice(4));
  parseData(levelData);
  
}

//parseData
function parseData(level) {
  let index = 0;
  const titleLength = level[index++];
  const title = level.slice(index, index + titleLength);
  ui.info.title.textContent = bytesToText(title);
  
  index += titleLength;
  const authorLength = level[index++];
  const author = level.slice(index, index + authorLength);
  ui.info.author.textContent = bytesToText(author);
  
  index += authorLength;
  const blocks = Array.from(level.slice(index));
  mekoBlocks = attributeAssignment(blocks);
  
  show(ui.info.container);
  displayBlocks();
}

// displayBlocks
function displayBlocks() {
  ui.blocks.cards.innerHTML = null;
  
  let blockType = {};
  mekoBlocks.forEach(val => {
    if (!blockType[val[0]]) {
      blockType[val[0]] = {
        value: val[0],
        count: 0
      }
    }
    blockType[val[0]].count++;
  })
  
  const sortedBlockType = Object.values(blockType).sort((a, b) => a.value - b.value);
  sortedBlockType.forEach(block => {
    const card = document.createElement('div');
    card.classList.add('decoded-card');
    
    const blockName = blockDefinitions[block.value].name;
    card.innerHTML = `
      <p><strong>${blockName}</strong></p>
      <p>Count: ${block.count}</p>
    `;
    
    card.addEventListener('click', () => {
      blockId = block.value;
      displayProperties();
    })
    ui.blocks.cards.append(card);
  })
  show(ui.blocks.container);
}

// displayProperties
function displayProperties() {
  ui.properties.cards.innerHTML = null;
  
  mekoBlocks.forEach((val, idx) => {
    if (val[0] !== blockId) {
      return;
    }
    
    const x = 1 + (idx % 16);
    const y = 1 + (Math.floor((idx % 256) / 16));
    const z = 1 + (Math.floor(idx / 256));
    
    const coord = `C${x}F${y}L${z}`;
    
    let attrName;
    const bd = blockDefinitions[val[0]];
    
    if (bd.isOriented && bd.isTextured) {
      attrName = `${orientations[val[1]].toUpperCase()}<br>Texture Value: ${val[2]}`;
    } else if (bd.isOriented && !bd.isTextured) {
      attrName = `${orientations[val[1]].toUpperCase()}`;
    } else if (!bd.isOriented && bd.isTextured) {
      attrName = `Texture Value: ${val[1]}`;
    } else {
      attrName = `"NO ATTRIBUTES"`
    }
    
    const card = document.createElement('div');
    card.classList.add('decoded-card', 'property-card');
    card.dataset.index = idx;
    card.innerHTML += `<p>${coord}</p>`;
    
    if (val[1] !== undefined) {
      card.innerHTML += `<p><small>${attrName}</small></p>`;
    }
    
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      updateSelectAll();
    })
    ui.properties.cards.append(card);
  })
  updateSelectAll();
  hide(ui.blocks.container);
  show(ui.properties.container);
}

function updateSelectAll() {
  const activeCard = ui.properties.cards.querySelectorAll('.active');
  selectAll.checked = activeCard.length === ui.properties.cards.children.length ? true : false;
}

// displayNewBlocks
function displayNewSelection() {
  const activeCard = ui.properties.cards.querySelectorAll('.active');
  if (activeCard.length === 0) {
    alert('Please select at least one block position to change.');
    return;
  }
  
  ui.newBlocks.description.innerHTML = null;
  ui.newBlocks.description.innerHTML = `
  <p>You are about to change ${activeCard.length} blocks.</p>
  <p><b>${blockDefinitions[blockId].name}</b></p>
  `;
  
  ui.newBlocks.orient.disabled = true;
  ui.newBlocks.font.disabled = true;
  
  ui.newBlocks.type.value = null;
  ui.newBlocks.orient.value = null;
  ui.newBlocks.font.value = null;
  
  show(ui.newBlocks.container);
  hide(ui.properties.container);
}

// qrGenerate
function qrGenerate(data) {
  let dataString = '';
  data.forEach(char => dataString += String.fromCharCode(char));
  
  const typeNumber = 0;
  const errorCorrectionLevel = 'L';
  const qr = qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(dataString);
  qr.make();
  
  const moduleCount = qr.getModuleCount();
  const cellSize = 4;
  const margin = (4 * cellSize);
  const canvasSize = (moduleCount + 8) * cellSize;
  
  const qrcvs = document.getElementById('qrCanvas');
  const qrdl = document.getElementById('qrDownload');
  
  if (qrcvs) {
    qrcvs.remove();
    qrdl.remove();
  }
  
  const [cvs, ctx] = createCanvas(canvasSize, canvasSize);
  cvs.id = "qrCanvas";
  ctx.save();
  ctx.translate(margin, margin);
  qr.renderTo2dContext(ctx, cellSize);
  ctx.restore();
  
  const a = document.createElement('a');
  a.id = "qrDownload"
  a.href = cvs.toDataURL();
  a.download = ui.info.title.textContent + ".png";
  a.innerHTML = `
    <button id="saveTitleButton" style="appearance: none; border: none; background-color: transparent;">
      <span class="material-symbols-outlined">download</span>
    </button>
  `;
  
  ui.image.container.append(cvs);
  ui.image.container.append(a);
}


export {
  mekoBlocks,
  blockID,
  jsqrDecode,
  parseData,
  displayBlocks,
  displayProperties,
  updateSelectAll,
  displayNewSelection,
  qrGenerate
}


import { ui } from "./ui-elements.js";
import { show, hide, bytesToText, attributeAssignment, createCanvas, formatId, updateGrid, SourSwal } from "./utils.js";
import { blockDefinitions, orientations, fontDefault, fontMap } from "./definitions.js";


let mekoBlocks;
let selectedId;

// Decoding QR Code
function jsqrDecode(image) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  
  const [cvs, ctx] = createCanvas(width, height);
  ctx.drawImage(image, 0, 0, width, height)
  
  const data = ctx.getImageData(0, 0, width, height);
  const imageData = data.data;
  
  const code = jsQR(imageData, width, height);
  
  if (!code) {
    SourSwal.fire({
      icon: 'warning',
      title: 'Failed',
      text:  'Failed to Decode QR Code.'
    });
    ui.message.textContent = "Failed to Decode QR Code.";
    return;
  }
  
  ui.message.textContent = "QR Code successfully decoded and level data processed!";
  
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
  hide(ui.info.edit);
  displayBlocks();
}

// displayBlocks
function displayBlocks() {
  const blockType = {};
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
  const blockArray = [];
  
  sortedBlockType.forEach(block => {
    const card = document.createElement('div');
    card.classList.add('block-card');
    
    const bd = blockDefinitions[block.value];
    
    card.dataset.count = `${block.count}`;
    card.style.backgroundPosition = `${bd.atlas.x}% ${bd.atlas.y}%`;
    
    if (block.value === 0 || block.value === 28) {
      card.textContent = bd.name;
    }
    
    card.addEventListener('click', () => {
      selectedId = block.value;
      displayProperties();
    })
    blockArray.push(card);
  })
  ui.blocks.cards.replaceChildren(...blockArray);
  
  show(ui.blocks.container);
  hide([
    ui.newBlocks.container,
    ui.qr.container
  ]);
  
  updateGrid(ui.blocks.cards, 85);
}

// displayProperties
function displayProperties() {
  ui.properties.header.textContent = `
    ${formatId(selectedId)} ${blockDefinitions[selectedId].name}
  `;
  
  const propertyArray = [];
  
  mekoBlocks.forEach((val, idx) => {
    if (val[0] !== selectedId) {
      return;
    }
    
    const x = 1 + (idx % 16);
    const y = 1 + (Math.floor((idx % 256) / 16));
    const z = 1 + (Math.floor(idx / 256));
    
    const coord = `C${x}F${y}L${z}`;
    
    let attrName;
    const bd = blockDefinitions[val[0]];
    
    const fontDisplay = fontMap[val[0]] || fontDefault;
    
    switch (bd.type) {
      case 3:
        attrName = `${orientations[val[1]]}<br> ${fontDisplay[val[2]]}`;
        break;
      case 2:
        attrName =  `${fontDisplay[val[1]]}`;
        break;
      case 1:
        attrName = `${orientations[val[1]]}`;
        break;
      case 0:
        attrName = `"NO ATTRIBUTES"`;
        break;
    }
    
    const card = document.createElement('div');
    card.classList.add('property-card');
    card.dataset.index = idx;
    card.innerHTML += `<p class="coord">${coord}</p>`;
    
    if (val[1] !== undefined) {
      card.innerHTML += `<p>${attrName}</p>`;
    }
    
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      updateSelectAll();
    })
    propertyArray.push(card);
  })
  ui.properties.cards.replaceChildren(...propertyArray);
  
  show(ui.properties.container);
  hide(ui.blocks.container);
  
  updateSelectAll();
  updateGrid(ui.properties.cards, 130);
}

function updateSelectAll() {
  const activeCard = ui.properties.cards.querySelectorAll('.active');
  ui.properties.selectAll.checked = activeCard.length === ui.properties.cards.children.length ? true : false;
}

// displayNewBlocks
function displayNewSelection() {
  const activeCard = ui.properties.cards.querySelectorAll('.active');
  if (activeCard.length === 0) {
    SourSwal.fire({
      icon: 'warning',
      title: 'Select Position',
      text: 'Please select at least one block position to change.'
    });
    return;
  }
  
  ui.newBlocks.header.textContent = `
    ${formatId(selectedId)} ${blockDefinitions[selectedId].name}
  `;
  
  ui.newBlocks.description.textContent = `
    You are about to change ${activeCard.length} blocks.
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
 
  SourSwal.fire({
    title: 'New QR Code',
    html: `
      <div id="qrContainer" class="qr-container">
        <canvas id="qrCanvas" class="qr-canvas"></canvas>
      </div>
    `,
    confirmButtonText: `
    <span class="material-symbols-outlined">
      download
    </span>
  `,
    showCancelButton: true,
    didOpen: () => {
      const cvs = document.getElementById('qrCanvas');
      cvs.width = canvasSize;
      cvs.height = canvasSize;
      
      const ctx = cvs.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.save();
      ctx.translate(margin, margin);
      qr.renderTo2dContext(ctx, cellSize);
      ctx.restore();
    },
    preConfirm: () => {
      const cvs = document.getElementById('qrCanvas');
      return new Promise((resolve, reject) => {
        cvs.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = ui.info.title.textContent + ".png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve(false);
        });
      });
    }
  });
}


export {
  mekoBlocks,
  selectedId,
  jsqrDecode,
  parseData,
  displayBlocks,
  displayProperties,
  updateSelectAll,
  displayNewSelection,
  qrGenerate
}

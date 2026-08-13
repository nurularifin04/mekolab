
import { ui } from "./ui-elements.js";
import { blockDefinitions } from "./definitions.js";


function show(elements, scroll = true, index = 0) {
  const showElements = (Array.isArray(elements) || elements instanceof NodeList)
    ? elements : [elements];
   
  showElements.forEach(el => {
    el.classList.remove('hidden');
  });
  
  if (scroll) {
    requestAnimationFrame(() => {
      if (showElements[index]) {
        showElements[index].scrollIntoView({
          block: 'start'
        })
      }
    });
  }
}

function hide(elements) {
  const hideElements = (Array.isArray(elements) || elements instanceof NodeList)
    ? elements : [elements];
   
  hideElements.forEach(el => {
    el.classList.add('hidden');
  });
}

function bytesToText(bytes) {
  return new TextDecoder('utf-8').decode(bytes);
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => ('0' + b.toString(16)).slice(-2))
    .join('').toUpperCase();
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }			
  return bytes;
}

function createCanvas(width, height, backgroundColor = "white") {
	const cvs = document.createElement('canvas');
	const ctx = cvs.getContext('2d');
	cvs.width = width;
	cvs.height = height;
	ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
	return [cvs, ctx];
}

function attributeAssignment(array) {
  const blockSets = [];
  let idx = 0;
  while (idx < array.length) {
    const id = array[idx];
    const bd = blockDefinitions[id];

    switch (bd.type) {
      case 3:
        blockSets.push([id, array[idx + 1], array[idx + 2]]);
        idx += 3;
        break;
      case 2:
      case 1:
        blockSets.push([id, array[idx + 1]]);
        idx += 2;
        break;
      case 0:
        blockSets.push([id]);
        idx += 1;
        break;
    }
  }
  return blockSets;
}
  
function createDropdown(element, options) {
  const newOptions = [];
  
  const noneOption = document.createElement('option');
  noneOption.value = null;
  noneOption.textContent = "-- Select --";
  newOptions.push(noneOption);
  
  options.forEach((opt, idx) => {
  	const option = document.createElement('option');
  	option.value = idx;
  	
  	if (typeof opt === 'object') {
  		option.innerHTML = `[${String(idx).padStart(3, '0')}] ${opt.name}`;
  	} else if (typeof opt === 'string') {
  		option.innerHTML = `[${String(idx).padStart(3, '0')}] ${opt}`;
  	} else {
  		option.textContent = opt;
  	}
  	newOptions.push(option);
  })
  element.replaceChildren(...newOptions);
}

function versionHeader(nestedArray) {
  const blockId= Math.max(...nestedArray.map(block => block[0]));
  let header = [19, 13, 252];
  
  if (blockId > 52) {
    header.unshift(3);
  } else if (blockId > 48) {
    header.unshift(2);
  } else {
    header.unshift(1);
  }
  
  return header;
}

function makeIcon(image) {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  
  const s = 100;
  const y0 = 74;
  const y1 = 568;
  const dy = y1 - y0;
  const add = (dy - s) / 2;
  const y = y0 + add;
  const x = (w - s) / 2;
  
  const [cvs, ctx] = createCanvas(s, s);
  ctx.drawImage(image, x, y, s, s, 0, 0, s, s);
  ui.image.container.append(cvs);
  
  cvs.id = "meicon";
  meicon.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = cvs.toDataURL();
    a.download = "nama.png";
    a.click();
  });
}

function updateGrid(container, childWidth) {
  if (container.offsetWidth <= 0) {
    return;
  }
  const maxColumns = Math.max(1, Math.floor(container.offsetWidth / childWidth));
  container.style.gridTemplateColumns = `repeat(${maxColumns}, 1fr)`;
}

const SourSwal = Swal.mixin({
  customClass: {
    popup: 'sour-popup',
    title: 'sour-title',
    htmlContainer: 'sour-html',
    actions: 'sour-actions',
    confirmButton: 'btn btn-lime',
    denyButton: 'btn btn-blue',
    cancelButton: 'btn btn-one'
  },
  
  confirmButtonText: `
    <span class="material-symbols-outlined">
      circle
    </span>
  `,
  
  denyButtonText: `
    <span class="material-symbols-outlined">
      block
    </span>
  `,
  
  cancelButtonText: `
    <span class="material-symbols-outlined">
      close
    </span>
  `,
  
  icon: 'warning',
  iconColor: '#32cd32',
  allowOutsideClick: false,
  buttonsStyling: false
});

export class Code {
  constructor (code, cvs, ctx) {
    this.bytes = code.binaryData;
    this.version = code.version;
    this.xmin = Math.round(code.location.topLeftCorner.x);
    this.xmax = Math.round(code.location.topRightCorner.x);
    this.ymin = Math.round(code.location.topLeftCorner.y);
    this.ymax = Math.round(code.location.bottomLeftCorner.y);
    
    this.XMIN_BOX = 304;
    this.YMIN_BOX = 596;
    this.BOX_SIZE = 350;
    
    this.cvs = cvs;
    this.ctx = ctx
  }
  
  state() {
    const quietSide = this.xmin - this.XMIN_BOX;
    const quietTop = this.ymin - this.YMIN_BOX;
    
    return this.cvs.width === 732
      && this.cvs.height === 1024
      && this.version > 17
      && quietSide === quietTop;
  }
  
  setMatrix() {
    this.modules = this.version * 4 + 17;
    this.moduleSize = (this.xmax - this.xmin) / this.modules;
    const xstart = (this.moduleSize / 2) + this.xmin;
    const ystart = (this.moduleSize / 2) + this.ymin;
    
    this.matrix = [];
    for (let row = ystart; row < this.ymax; row += this.moduleSize) {
      const rowMatrix = [];
      for (let col = xstart; col < this.xmax; col += this.moduleSize) {
        const color = this.ctx.getImageData(col, row, 1, 1).data;
        const threshold = 128;
        if (color[0] < threshold && color[1] < threshold && color[2] < threshold) {
          rowMatrix.push(1);
        } else {
          rowMatrix.push(0);
        }
      }
      this.matrix.push(rowMatrix);
    }
  }
  
  optimize() {
    if (!this.state()) {
      return;
    }
    
    this.setMatrix();
    
    //this.ctx.fillStyle = 'white';
    //this.ctx.fillRect(this.XMIN_BOX, this.YMIN_BOX, this.BOX_SIZE, this.BOX_SIZE);
    
    
    const maxModuleSize = Math.round(this.BOX_SIZE / (this.modules));
    const dimension = this.modules * maxModuleSize;
    //const quietZone = Math.ceil((this.BOX_SIZE - dimension) / 2);
    const quietZone = 7 * maxModuleSize;
    const qrArea = dimension + (2 * quietZone);
    
    const [qrcvs, qrctx] = createCanvas(qrArea, qrArea);
    qrctx.translate(quietZone, quietZone);
    
    for (let row = 0; row < this.modules; row++) {
      for (let col = 0; col < this.modules; col++) {
        qrctx.fillStyle = this.matrix[row][col] === 1 ? 'black' : 'white';
        qrctx.fillRect(col * maxModuleSize, row * maxModuleSize, maxModuleSize, maxModuleSize);
      }
    }
    
    this.ctx.drawImage(
      qrcvs, 0, 0, qrArea, qrArea, this.XMIN_BOX, this.YMIN_BOX, this.BOX_SIZE, this.BOX_SIZE
    );
    
    this.cvs.addEventListener('click', () => {
      this.cvs.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `[Optimized] ${ui.info.title.textContent}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    });
  }
}


export class Decode {
  constructor (image) {
    this.image = image;
    this.width = image.naturalWidth;
    this.height = image.naturalHeight;
    
    this.BOX_SIZE = 350;
    this.X_MIN = 304;
    this.Y_MIN = 596;
    
    this.black = [0, 0, 0, 255];
    this.white = [255, 255, 255, 255];
    
    this.getCanvas();
    this.decoding();
  }
  
  getCanvas() {
    [ this.cvs, this.ctx ] = createCanvas(this.width, this.height, 'transparent');
    this.ctx.drawImage(this.image, 0, 0, this.width, this.height);
    
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.data = this.imageData.data;
  }
  
  decoding() {
    const code = jsQR(this.data, this.width, this.height);
    this.result = code.binaryData;
    this.version = code.version;
    this.xMin = Math.round(code.location.topLeftCorner.x);
    this.xMax = Math.round(code.location.topRightCorner.x);
    this.yMin = Math.round(code.location.topLeftCorner.y);
    this.yMax = Math.round(code.location.bottomLeftCorner.y);
    
    this.modules = this.version * 4 + 17;
    this.modSize = (this.xMax - this.xMin) / this.modules;
    
    
    const box = this.ctx.createImageData(this.BOX_SIZE, this.BOX_SIZE);
    
    this.setModule(box.data, 0, 0, this.black)
    
    this.ctx.putImageData(box, this.X_MIN, this.Y_MIN)
    
    ui.message.textContent = "QR Code successfully decoded and level data processed!";
    ui.image.canvas.replaceChildren(this.cvs);

  }
  
  setModule(data, x, y, color) {
    for (let row = y; row < y + this.modSize; row++) {
      for (let col = x; col < x + this.modSize; col++) {
        const index = (row * this.BOX_SIZE + col) * 4;
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = color[3];
      }
    }
  }
  
  getPixel(x, y) {
    
  }

}



export {
  show, hide,
  bytesToText, textToBytes,
  createCanvas,
  attributeAssignment,
  createDropdown,
  versionHeader,
  updateGrid,
  SourSwal
}


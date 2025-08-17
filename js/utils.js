
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

function createCanvas(width, height) {
	const cvs = document.createElement('canvas');
	const ctx = cvs.getContext('2d');
	cvs.width = width;
	cvs.height = height;
	ctx.fillStyle = 'white';
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

function formatId(index) {
  if (String(index).length < 2) {
    return `[00${index}]`;
  } else if (String(index).length < 3) {
    return `[0${index}]`;
  } else {
    return `[${index}]`;
  }
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
  		option.innerHTML = `${formatId(idx)} ${opt.name}`;
  	} else if (typeof opt === 'string') {
  		option.innerHTML = `${formatId(idx)} ${opt}`;
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

function codeProcess(version, location) {
  const modules = (version * 4) + 17;
  const topRightX= location.topRightCorner.x;
  const topLeftX = location.topLeftCorner.x;
  const qrSize = topRightX - topLeftX;
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
    cancelButton: 'btn btn-one'
  },
  iconColor: '#32cd32',
  confirmButtonText: `
    <span class="material-symbols-outlined">
      circle
    </span>
  `,
  cancelButtonText: `
    <span class="material-symbols-outlined">
      close
    </span>
  `,
  
  allowOutsideClick: false,
  buttonsStyling: false
});


export {
  show,
  hide,
  bytesToText,
  textToBytes,
  createCanvas,
  attributeAssignment,
  createDropdown,
  versionHeader,
  formatId,
  updateGrid,
  SourSwal
}


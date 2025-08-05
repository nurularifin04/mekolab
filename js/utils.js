
import { blockDefinitions } from ".definitions.js";

function show(elements) {
  if (Array.isArray(elements) || elements instanceof NodeList) {
    elements.forEach(lmn => {
      lmn.classList.remove('hidden');
    });
  } else {
    elements.classList.remove('hidden');
  }
}

function hide(elements) {
  if (Array.isArray(elements) || elements instanceof NodeList) {
    elements.forEach(lmn => {
      lmn.classList.add('hidden');
    });
  } else {
    elements.classList.add('hidden');
  }
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
    const blockId = array[idx];
    const bd = blockDefinitions[blockId];

    switch (bd.type) {
      case 3:
        blockSets.push([blockId, array[idx + 1], array[idx + 2]]);
        idx += 3;
        break;
      case 2:
      case 1:
        blockSets.push([blockId, array[idx + 1]]);
        idx += 2;
        break;
      case 0:
        blockSets.push([blockId]);
        idx += 1;
        break;
    }
  }
  return blockSets;
}


function createDropdown(element, options) {
  const noneOption = document.createElement('option');
  noneOption.value = null;
  noneOption.textContent = "-- Select --";
  element.appendChild(noneOption);
  
  options.forEach ((opt, val) => {
  	const option = document.createElement('option');
  	option.value = val;
  	if (typeof opt === 'object') {
  		option.textContent = opt.name;
  	} else if (typeof opt === 'string') {
  		option.textContent = opt.toUpperCase();
  	} else {
  		option.textContent = opt;
  	}
  	element.appendChild(option);
  })
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
  //alert(qrSize / modules)
}

export {
  show,
  hide,
  bytesToText,
  textToBytes,
  createCanvas,
  attributeAssignment,
  createDropdown,
  versionHeader
}


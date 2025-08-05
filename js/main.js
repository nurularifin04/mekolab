
import { ui } from "./ui-elements.js";
import { mekoBlocks, selectedId, jsqrDecode, displayBlocks, displayNewSelection, qrGenerate } from "./level-processor.js"
import { show, hide, textToBytes, createDropdown, versionHeader } from "./utils.js";
import { blockDefinitions, orientations, fontTexture } from "./definitions.js";


document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM complete');
  
  hide([
    ui.image.fileInput, ui.image.preview,
    ui.info.container, ui.blocks.container,
    ui.properties.container, ui.newBlocks.container
  ]);
  
  ui.message.textContent = "Select a Mekorama QR Code image to begin.";
  
  createDropdown(ui.newBlocks.type, blockDefinitions);
  createDropdown(ui.newBlocks.orient, orientations);
  createDropdown(ui.newBlocks.font, fontTexture);
  
});

// image listener
ui.image.uploadButton.addEventListener('click', () => ui.image.fileInput.click());
ui.image.fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  ui.message.textContent = "Decoding..."
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      ui.image.preview.src = e.target.result;
      ui.image.preview.onload = () => {
        show(ui.image.preview);
        jsqrDecode(ui.image.preview);
        ui.message.textContent = "Decode Succes. Data Processing...";
        
      }
    }
  reader.readAsDataURL(file);
  
  }
});

// info listener
ui.info.editButton.addEventListener('click', () => {
  ui.info.titleInput.value = ui.info.title.textContent;
  show(ui.info.edit);
  hide(ui.info.container);
});

ui.info.saveButton.addEventListener('click', () => {
  if (!ui.info.titleInput.value) {
    alert("Title cannot be empty!")
  } else {
    ui.info.title.textContent = ui.info.titleInput.value;
    show(ui.info.container);
    hide(ui.info.edit);
    ui.message.textContent = "Title updated.";
  }
});

// properties listener
ui.properties.selectAll.addEventListener('change', (event) => {
  const cards = ui.properties.cards.querySelectorAll('.property-card');
  cards.forEach(card => {
    if (event.target.checked) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  })
});

ui.properties.backButton.addEventListener('click', () => {
  show(ui.blocks.container);
  hide(ui.properties.container);
});

ui.properties.changeButton.addEventListener('click', () => {
  displayNewSelection();
});

// newBlocks listener
ui.newBlocks.type.addEventListener('change', () => {
  const block = blockDefinitions[ui.newBlocks.type.value];

  const handleProperty = (element, condition) => {
    element.disabled = !condition;
    if (!condition) {
      element.value = null;
    }
  };

  handleProperty(ui.newBlocks.orient, (block.type & 1));
  handleProperty(ui.newBlocks.font, (block.type & 2));
});

ui.newBlocks.cancelButton.addEventListener('click', () => {
  show(ui.properties.container);
  hide(ui.newBlocks.container);
});

ui.newBlocks.saveButton.addEventListener('click', () => {
  const activeCard = ui.properties.cards.querySelectorAll('.active');
  
  const newBlockId = ui.newBlocks.type.value;
  const newOrient = ui.newBlocks.orient.value;
  const newFont = ui.newBlocks.font.value;
  
  const blockDef = blockDefinitions[selectedId];
  const newBlockDef = newBlockId !== 'null' ? blockDefinitions[parseInt(newBlockId)] : null;
  
  if (newBlockId === 'null') {
    alert("Please select a New Block.");
    return;
  }
  
  if ((newOrient === 'null') && !ui.newBlocks.orient.disabled) {
    if ((blockDef.type & 1) !== (newBlockDef.type & 1)) {
      alert(`Please select a new orientation.\n${blockDef.name} has not attribute Orientation.`);
      return;
    }
  }
  
  if ((newFont === 'null') && !ui.newBlocks.font.disabled) {
    if ((blockDef.type & 2) !== (newBlockDef.type & 2)) {
      alert(`Please select a new font texture.\n${blockDef.name} has not attribute Font Texture.`);
      return;
    }
  }
  
  activeCard.forEach(card => {
    const idx = parseInt(card.dataset.index);
    const oldBlock = mekoBlocks[idx];
    
    const oldOrient = (blockDef.type & 1) ? oldBlock[1] : null;
    const oldFont = (blockDef.type & 2) ? oldBlock[oldBlock.length - 1] : null;
    
    const updateBlock = [parseInt(newBlockId)];
    
    if (newBlockDef.type & 1) {
      if (newOrient !== 'null') {
        updateBlock.push(parseInt(newOrient));
      } else if (oldOrient !== null) {
        updateBlock.push(oldOrient);
      }
    }
    
    if (newBlockDef.type & 2) {
      if (newFont !== 'null') {
        updateBlock.push(parseInt(newFont));
      } else if (oldFont !== null) {
        updateBlock.push(oldFont);
      }
    }
    
    mekoBlocks[idx] = updateBlock;
  });
  
  let confirm = `${activeCard.length} blocks successfully changed.\nClick Generate to download New QR Code.`;
  alert(confirm);
  
  ui.message.innerHTML = `${blockDef.name} successfully changed to ${newBlockDef.name}.`;
  
  hide(ui.newBlocks.container);
  displayBlocks();
});

// generate listener
ui.generateButton.addEventListener('click', () => {
  if (!mekoBlocks) {
    alert('Mekorama data not found. Please upload a level QR Code first.');
    return;
  }
  
  const newTitle = textToBytes(ui.info.title.textContent);
  const newAuthor = textToBytes(ui.info.author.textContent);
  const newBlocks = mekoBlocks.flat();
  
  const newHeader = versionHeader(mekoBlocks);
  const newLevel = new Uint8Array([
    newTitle.length, ...newTitle,
    newAuthor.length, ...newAuthor,
    ...newBlocks
  ]);
  
  const newData = [...newHeader, ...pako.deflate(newLevel)];
  qrGenerate(newData);
  
});



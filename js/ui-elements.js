

export const ui = {
  message: document.getElementById('message'),
  footer: document.getElementById('footer'),
  generateButton: document.getElementById('generateButton'),
  
  image: {
    container: document.getElementById('imageContainer'),
    fileInput: document.getElementById('imageInput'),
    preview: document.getElementById('uploadedImage'),
    uploadButton: document.getElementById('uploadButton')
  },
  
  info: {
    container: document.getElementById('infoView'),
    title: document.getElementById('displayTitle'),
    author: document.getElementById('displayAuthor'),
    editButton: document.getElementById('editTitleButton'),
    edit: document.getElementById('editView'),
    titleInput: document.getElementById('titleInput'),
    saveButton: document.getElementById('saveTitleButton')
  },
  
  blocks: {
    container: document.getElementById('blockTypes'),
    cards: document.getElementById('blockCards')
    },
  
  properties: {
    container: document.getElementById('properties'),
    header: document.getElementById('propertyHeader'),
    cards: document.getElementById('propertyCards'),
    selectAll: document.getElementById('selectAll'),
    backButton: document.getElementById('backPropertyButton'),
    changeButton: document.getElementById('changePropertyButton')
  },
  
  newBlocks: {
    container: document.getElementById('newBlockSelection'),
    header: document.getElementById('selectHeader'),
    description: document.getElementById('selectDescription'),
    type: document.getElementById('newBlockType'),
    orient: document.getElementById('newOrientation'),
    font: document.getElementById('newTexture'),
    cancelButton: document.getElementById('cancelNewButton'),
    saveButton: document.getElementById('saveNewButton')
  }
};


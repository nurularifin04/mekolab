export const loadImageFile = file => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = async () => {
      await img.decode();
      resolve(img);
    }
    
    img.onerror = error => {
      URL.revokeObjectURL(url);
      reject(error);
    }
    
    img.src = url;
    img.alt = file.name;
    img.className = 'card';
  });
}

const frag = document.createDocumentFragment();
  

export const loadMultipleFiles = async (files, container) => {
  const fileArray = Array.from(files);
  const loadedImages = await Promise.all(fileArray.map(loadImageFile));
  const fragment = document.createDocumentFragment();
  
  loadedImages.forEach(img => fragment.appendChild(img));
  container.appendChild(fragment);
}



export const toggle = {
  fullScreen(el) {
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  },
  
  display(elements) {
    const elem = (Array.isArray(elements) || elements instanceof NodeList) ? elements : [elements];
    elem.forEach(el => 
      el.classList.contains('hidden')
      ? el.classList.remove('hidden')
      : el.classList.add('hidden'));
  }
}


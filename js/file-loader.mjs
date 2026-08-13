export const loadImageFile = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = async () => {
      await img.decode();
      resolve(img);
    }
    
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    }
    
    img.src = url;
    img.alt = file.name;
    img.className = 'card';
  });
}
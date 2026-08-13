const decoder = new TextDecoder('iso-8859-1');
const encoder = new TextEncoder();

export const code2Char = (uint8) => decoder.decode(uint8);

export const char2Code = (text) => encoder.encode(text);

export const code2Hex = (uint8) => {
  return [...uint8]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

export const hex2Code = (hex) => {
  const code = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    code[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }			
  return code;
};


export const path2Bitmap = async (path) => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} for path: ${path}`);
    }
    const blob = await response.blob();
    return await createImageBitmap(blob);
  } catch (error) {
    setTimeout(() => { throw error; }, 0);
    return null; 
  }
};
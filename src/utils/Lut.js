// Lut.js

// Parse file CUBE
export const parseCubeFile = (text) => {
    const lines = text.split('\n');
    let size = 0;
    let data = [];
  
    let domainMin = [0.0, 0.0, 0.0];
    let domainMax = [1.0, 1.0, 1.0];
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
  
      // Skip komentar dan baris kosong
      if (line.startsWith('#') || line === '') continue;
  
      // Baca ukuran LUT
      if (line.startsWith('LUT_3D_SIZE')) {
        const parts = line.split(/\s+/);
        size = parseInt(parts[1]);
        if (isNaN(size) || size <= 0) throw new Error('Invalid LUT_3D_SIZE value.');
        continue;
      }
  
      // Optional: DOMAIN_MIN / DOMAIN_MAX
      if (line.startsWith('DOMAIN_MIN')) {
        domainMin = line.split(/\s+/).slice(1).map(parseFloat);
        continue;
      }
  
      if (line.startsWith('DOMAIN_MAX')) {
        domainMax = line.split(/\s+/).slice(1).map(parseFloat);
        continue;
      }
  
      // Data RGB
      if (/^[\d.\-+eE]+\s+[\d.\-+eE]+\s+[\d.\-+eE]+$/.test(line)) {
        const [r, g, b] = line.split(/\s+/).map(parseFloat);
        if ([r, g, b].some(isNaN)) throw new Error(`Invalid RGB value on line ${i + 1}`);
        data.push(r, g, b);
      }
    }
  
    // Validasi akhir
    if (data.length !== size * size * size * 3) {
      console.warn(`Expected ${size ** 3} RGB entries, got ${data.length / 3}`);
    }
  
    return { size, data, domainMin, domainMax };
  };
  
  
  // Terapkan LUT ke gambar
export const applyLutToImage = (image, lutData, outputType = 'image') => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const { size, lut } = lutData;
        const cubeSize = size;
        
        // Apply LUT to each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          
          // Calculate indices
          const rx = r * (cubeSize - 1);
          const gx = g * (cubeSize - 1);
          const bx = b * (cubeSize - 1);
          
          const x0 = Math.floor(rx);
          const y0 = Math.floor(gx);
          const z0 = Math.floor(bx);
          
          const x1 = Math.min(x0 + 1, cubeSize - 1);
          const y1 = Math.min(y0 + 1, cubeSize - 1);
          const z1 = Math.min(z0 + 1, cubeSize - 1);
          
          // Calculate interpolation weights
          const xd = rx - x0;
          const yd = gx - y0;
          const zd = bx - z0;
          
          // Trilinear interpolation formula
          const index = (x) => x[0] * Math.pow(cubeSize, 2) + x[1] * cubeSize + x[2];
          
          const c000 = lut[index([x0, y0, z0])];
          const c001 = lut[index([x0, y0, z1])];
          const c010 = lut[index([x0, y1, z0])];
          const c011 = lut[index([x0, y1, z1])];
          const c100 = lut[index([x1, y0, z0])];
          const c101 = lut[index([x1, y0, z1])];
          const c110 = lut[index([x1, y1, z0])];
          const c111 = lut[index([x1, y1, z1])];
          
          // Interpolate RGB values
          const newR = 
            c000[0] * (1 - xd) * (1 - yd) * (1 - zd) +
            c001[0] * (1 - xd) * (1 - yd) * zd +
            c010[0] * (1 - xd) * yd * (1 - zd) +
            c011[0] * (1 - xd) * yd * zd +
            c100[0] * xd * (1 - yd) * (1 - zd) +
            c101[0] * xd * (1 - yd) * zd +
            c110[0] * xd * yd * (1 - zd) +
            c111[0] * xd * yd * zd;
            
          const newG = 
            c000[1] * (1 - xd) * (1 - yd) * (1 - zd) +
            c001[1] * (1 - xd) * (1 - yd) * zd +
            c010[1] * (1 - xd) * yd * (1 - zd) +
            c011[1] * (1 - xd) * yd * zd +
            c100[1] * xd * (1 - yd) * (1 - zd) +
            c101[1] * xd * (1 - yd) * zd +
            c110[1] * xd * yd * (1 - zd) +
            c111[1] * xd * yd * zd;
            
          const newB = 
            c000[2] * (1 - xd) * (1 - yd) * (1 - zd) +
            c001[2] * (1 - xd) * (1 - yd) * zd +
            c010[2] * (1 - xd) * yd * (1 - zd) +
            c011[2] * (1 - xd) * yd * zd +
            c100[2] * xd * (1 - yd) * (1 - zd) +
            c101[2] * xd * (1 - yd) * zd +
            c110[2] * xd * yd * (1 - zd) +
            c111[2] * xd * yd * zd;
          
          // Update pixel data
          data[i] = Math.round(newR * 255);
          data[i + 1] = Math.round(newG * 255);
          data[i + 2] = Math.round(newB * 255);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        if (outputType === 'url') {
          resolve(canvas.toDataURL('image/png'));
        } else {
          // Create a new image from the canvas
          const newImg = new window.Image();
          newImg.onload = () => resolve(newImg);
          newImg.onerror = (err) => reject(err);
          newImg.src = canvas.toDataURL('image/png');
        }
      } catch (error) {
        reject(error);
      }
    });
};
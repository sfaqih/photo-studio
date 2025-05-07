import fsPremises from 'fs/promises';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const compressImagesFromFolder = async (folderPath, outputPath) => {
    const files = fs.readdirSync(folderPath).filter(file => /\.(jpe?g|png)$/i.test(file));
    await fsPremises.mkdir(outputPath, { recursive: true });
  
    const compressOne = async (file) => {
      const inputPath = path.join(folderPath, file);
      const outputFile = path.join(outputPath, file);
      
      const metadata = await sharp(inputPath).metadata();

      try {
        // console.log(`Compressed outputFile: ${outputFile}`);
        await sharp(inputPath)
          .resize({
            width: parseInt((metadata.width * 0.15).toFixed()),
            height: parseInt((metadata.height * 0.15).toFixed()),
            fit: sharp.fit.cover,
          }) // compress to 70% quality
          .withMetadata()
          .toFile(outputFile);
  
        // console.log(`Compressed: ${file}`);
      } catch (err) {
        console.error(`Failed to compress ${file}:`, err.message);
      }
    };
  
    return files.map((file) => compressOne(file));

};
import { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import multer from 'multer';
import cors from 'cors';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper to run multer middleware in Next.js
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default async function handler(req, res) {
  // Enable CORS
  await runMiddleware(req, res, cors());

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Process the file upload
    await runMiddleware(req, res, upload.single('image'));

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const result = await processImage(req.file.buffer);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: 'Error processing image' });
  }
}

async function processImage(imageBuffer) {
  const fullWidth = 150;
  const fullHeight = 150;
  const partSize = 75;

  // Use sharp to resize the image while maintaining aspect ratio
  const resizedImage = await sharp(imageBuffer)
    .resize(fullWidth, fullHeight, {
      fit: 'contain',
      background: { r: 14, g: 14, b: 14 },
    })
    .toBuffer();

  // Load the image with canvas
  const canvas = createCanvas(fullWidth, fullHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = "#0e0e0e";
  ctx.fillRect(0, 0, fullWidth, fullHeight);

  const img = await loadImage(resizedImage);
  ctx.drawImage(img, 0, 0);

  const resultParts = [];
  const regions = [
    { x: 0, y: 0 },
    { x: 75, y: 0 },
    { x: 0, y: 75 },
    { x: 75, y: 75 }
  ];

  regions.forEach(region => {
    const imageData = ctx.getImageData(region.x, region.y, partSize, partSize).data;
    let part = '';
    for (let i = 0; i < imageData.length; i += 4) {
      let r = imageData[i];
      let g = imageData[i + 1];
      let b = imageData[i + 2];
      let a = imageData[i + 3];
      if (a === 0) {
        r = 14;
        g = 14;
        b = 14;
      }
      part += `.${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      if ((i / 4 + 1) % partSize === 0) part += ',';
    }
    resultParts.push(part.trim());
  });

  const output = resultParts.join(',').replace(/,$/g, '');

  return {
    text: output,
    imageUrl: canvas.toDataURL()
  };
}

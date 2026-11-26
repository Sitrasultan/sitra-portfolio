
import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url) });
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadsDir = path.join(process.cwd(), 'server', 'uploads');

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error('Cloudinary credentials are missing from server/.env');
}

const uploadImage = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'sitra-portfolio',
        public_id: path.parse(filename).name,
        overwrite: true,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

const getFilename = value => {
  try {
    const clean = value.split('?')[0].replace(/\\/g, '/');
    return decodeURIComponent(path.basename(clean));
  } catch {
    return path.basename(value);
  }
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const files = fs.readdirSync(uploadsDir).filter(file =>
    /\.(jpe?g|png|webp|gif)$/i.test(file)
  );

  const urls = new Map();

  console.log(`Found ${files.length} image files`);

  for (const file of files) {
    const buffer = fs.readFileSync(path.join(uploadsDir, file));
    const url = await uploadImage(buffer, file);
    urls.set(file, url);
    console.log('Uploaded:', file);
  }

  let updated = 0;

  for (const collectionName of ['projects', 'certs']) {
    const collection = mongoose.connection.collection(collectionName);
    const documents = await collection.find({}).toArray();

    for (const doc of documents) {
      const changes = {};

      if (
        typeof doc.imageUrl === 'string' &&
        doc.imageUrl.includes('/uploads/')
      ) {
        const filename = getFilename(doc.imageUrl);
        if (urls.has(filename)) {
          changes.imageUrl = urls.get(filename);
        }
      }

      if (Array.isArray(doc.screenshots)) {
        const screenshots = doc.screenshots.map(value => {
          if (typeof value !== 'string' || !value.includes('/uploads/')) {
            return value;
          }

          return urls.get(getFilename(value)) || value;
        });

        if (screenshots.some((value, i) => value !== doc.screenshots[i])) {
          changes.screenshots = screenshots;
        }
      }

      if (Object.keys(changes).length) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: changes }
        );
        updated++;
      }
    }
  }

  console.log('Migration completed!');
  console.log('Images uploaded:', urls.size);
  console.log('Database records updated:', updated);

  await mongoose.disconnect();
}

main().catch(async error => {
  console.error('Migration failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});

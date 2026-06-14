import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
];

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const dest = path.join(__dirname, '../public/models');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

Promise.all(models.map(model => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(dest, model));
    https.get(baseUrl + model, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', err => {
      fs.unlink(path.join(dest, model), () => reject(err));
    });
  });
})).then(() => {
  console.log('Models downloaded successfully!');
}).catch(err => {
  console.error('Error downloading models:', err);
});

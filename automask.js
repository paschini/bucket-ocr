const path = require('path');
const vision = require('@google-cloud/vision');
const { Storage } = require('@google-cloud/storage');
const { loadImage, createCanvas } = require('canvas');

async function getVertices(data) {
  const client = new vision.ImageAnnotatorClient();

  // Performs text detection on the gcs file
  const [result] = await client.textDetection(`gs://${data.bucket}/${data.name}`);
  const detections = result.textAnnotations;
  return detections.filter(group => group.description.match(new RegExp('([0-9]{4})'))).map(groupVertices => ({
    vertices: groupVertices.boundingPoly.vertices
  }), []);
}

async function getImage(data) {
  const storage = new Storage();

// Download file from bucket.
  const tempLocalPath = `${__dirname}/tmp/${path.parse(data.name).base}`;
  const file = storage.bucket(data.bucket).file(data.name);
  try {
    await file.download({destination: tempLocalPath});
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  return await loadImage(tempLocalPath);
}

async function uploadImage(data) {
  const storage = new Storage();
  const fileName = `${__dirname}/tmp/${data.name}`;

// Upload file to bucket.
  await storage.bucket(data.bucket).upload(fileName, {destination: `masked_${data.name}`});
}

async function deleteUnmasked(data) {
  const storage = new Storage();
  const originalFile = storage.bucket(data.bucket).file(data.name);
  const tempFile = `${__dirname}/tmp/${path.parse(data.name).base}`;

  await storage.delete(originalFile);
  await storage.delete(tempFile);
}

async function drawMask(data) {
  const image = await getImage(data);
  const numberGroupsVertices = await getVertices(data);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "#000000";
  ctx.fillRect( // masks all but the last 4 digits
    numberGroupsVertices[1].vertices[0].x, numberGroupsVertices[1].vertices[0].y,
    numberGroupsVertices[3].vertices[1].x - numberGroupsVertices[1].vertices[0].x,
    numberGroupsVertices[4].vertices[2].y - numberGroupsVertices[1].vertices[0].y
  );

  // to mask all of the numbers:
  // ctx.fillRect(
  //   numberGroupsVertices[1].vertices[0].x, numberGroupsVertices[1].vertices[0].y,
  //   numberGroupsVertices[4].vertices[1].x - numberGroupsVertices[1].vertices[0].x,
  //   numberGroupsVertices[4].vertices[2].y - numberGroupsVertices[1].vertices[0].y
  // );

  const fs = require('fs');
  const out = fs.createWriteStream(`${__dirname}/tmp/${data.name}`);
  const stream = canvas.createJPEGStream();
  stream.pipe(out);
  await out.on('finish', () => console.log('masked file saved.'));

  await uploadImage(data);
}

exports.maskImage = async function(event) {
  await drawMask(event.data);
  await deleteUnmasked(event.data);
};

// uncomment next line and run "node ocr" on your terminal
// drawMask({ name: 'testcc.jpg', bucket: 'elliestestbucket' }).then();


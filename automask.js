const os = require('os');
// const path = require('path');
const vision = require('@google-cloud/vision');
const { Storage } = require('@google-cloud/storage');
const { loadImage, createCanvas } = require('canvas');

async function getVertices(data) {
  // do not re-mask files
  if (data.name.contains("masked")) { return; }

  const client = new vision.ImageAnnotatorClient();

  // Performs text detection on the gcs file
  // use this locally
  // const [result] = await client.textDetection(`./tmp/${data.name}`);
  const [result] = await client.textDetection(`gs://${data.bucket}/${data.name}`);

  const detections = result.textAnnotations;

  console.log('All text found:');
  detections.map(block => console.log(JSON.stringify(block)));

  // aiming for groups of 3 digits instead of 4 relaxes the detection a bit and helps with some card pictures
  return detections.filter(group => group.description.match(new RegExp('([0-9]{3})'))).map(groupVertices => ({
    vertices: groupVertices.boundingPoly.vertices
  }), []);
}

async function getImage(data) {
  const storage = new Storage();

  // use this locally
  // const tempLocalPath = `${__dirname}/tmp/${path.parse(data.name).base}`;

  // Download file from bucket. use this when deployed
  const tempLocalPath = `${os.tmpdir()}/${data.name}`;
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
  const fileName = `${os.tmpdir()}/masked_${data.name}`;

  // Upload file to bucket.
  await storage.bucket(data.bucket).upload(fileName, {destination: `masked_${data.name}`});
}

async function deleteUnmasked(data) {
  const storage = new Storage();
  const originalFile = storage.bucket(data.bucket).file(data.name);
  const tempFile = `${os.tmpdir()}/masked_${data.name}`;

  await originalFile.delete();

  const fs = require('fs');
  await fs.unlink(tempFile, (err) => {
    if (err) throw err;
    console.log(`deleted: ${tempFile}`);
  });
}

async function drawMask(data) {
  console.log(`File processed: ${data.name}`);

  const image = await getImage(data);
  const numberGroupsVertices = await getVertices(data);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  console.log(`Found ${numberGroupsVertices.length} groups`);
  numberGroupsVertices.map(vertices => console.log(JSON.stringify(vertices)));

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "#000000";

  numberGroupsVertices.length < 5 ?
    ctx.fillRect( // masks all but the last 4 digits
      numberGroupsVertices[0].vertices[0].x, numberGroupsVertices[1].vertices[0].y,
      numberGroupsVertices[1].vertices[1].x - numberGroupsVertices[1].vertices[0].x,
      numberGroupsVertices[1].vertices[2].y - numberGroupsVertices[1].vertices[0].y
    )
    :
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
  const out = fs.createWriteStream(`${os.tmpdir()}/masked_${data.name}`);
  const stream = canvas.createJPEGStream();
  stream.pipe(out);
  await out.on('finish', () => console.log('masked file saved.'));

  await uploadImage(data);
}

exports.maskImage = async function(data) {
  await drawMask(data);
  await deleteUnmasked(data);
};

// uncomment next line and run "node automask" on your terminal
// drawMask({ name: 'testcc3.jpg', bucket: 'elliestestbucket' }).then();


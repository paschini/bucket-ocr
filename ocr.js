// credentials:
// set GOOGLE_APPLICATION_CREDENTIALS=[PATH]
// [path] to json key file obtained from google cloud service account

async function detectTextGCS() {
  // [START vision_text_detection_gcs]
  // Imports the Google Cloud client libraries
  const vision = require('@google-cloud/vision');

  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
     const bucketName = 'elliestestbucket';
     const fileName = 'testcc.jpg';

    // Performs text detection on the gcs file
  const [result] = await client.textDetection(`gs://${bucketName}/${fileName}`);
  const detections = result.textAnnotations;

  // index 3 4 5 and 6 would be 4 blocks consisting of the cc number
  // console.log(detections[3].description, detections[3].boundingPoly.vertices);
  // return detections[3].boundingPoly.vertices;

  console.log('Text:');
  detections.forEach(text => console.log(text));
  // [END vision_text_detection_gcs]
}

async function getDetectedText(groupIndex) {
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();

  const bucketName = 'elliestestbucket';
  const fileName = 'testcc.jpg';

  // Performs text detection on the gcs file
  const [result] = await client.textDetection(`gs://${bucketName}/${fileName}`);
  const detections = result.textAnnotations;
  console.log(detections[groupIndex].description, detections[groupIndex].boundingPoly.vertices);
}

async function getVertices() {
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();

  const bucketName = 'elliestestbucket';
  const fileName = 'testcc.jpg';

  // Performs text detection on the gcs file
  const [result] = await client.textDetection(`gs://${bucketName}/${fileName}`);
  const detections = result.textAnnotations;
  // return detections[groupIndex].boundingPoly.vertices;
  return detections.filter(group => group.description.match(new RegExp('([0-9]{4})'))).map(groupVertices => ({
    description: groupVertices.description,
    vertices: groupVertices.boundingPoly.vertices
  }), []);
}

async function getImage() {
  const path = require('path');
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage();
  const { loadImage } = require('canvas');

  const bucketName = 'elliestestbucket';
  const fileName = 'testcc.jpg';

// Download file from bucket.
  const tempLocalPath = `${__dirname}/tmp/${path.parse(fileName).base}`;
  const file = storage.bucket(bucketName).file(fileName);
  try {
    await file.download({destination: tempLocalPath});
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  return await loadImage(tempLocalPath);
}

async function drawMask() {
  const { createCanvas } = require('canvas');
  const image = await getImage();
  const numberGroupsVertices = await getVertices();
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "#000000";
  ctx.fillRect(
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
  const out = fs.createWriteStream(`${__dirname}/tmp/result.jpg`);
  const stream = canvas.createJPEGStream();
  stream.pipe(out);
  await out.on('finish', () => console.log('masked file saved.'));

  // TODO: uplaod file back to bucket
}

drawMask().then(() => console.log('finished'));
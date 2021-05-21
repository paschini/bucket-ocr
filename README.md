# Automatic Credit Card Masking Google Cloud Function
What you need to get started:
* a Google Cloud account with billing enabled
* a project in your account with:
    * 2 Google Bucket Storages configured
    * Google Vision API enabled
    * Google Cloud Functions API enabled
    

## Credentials:
To run this app from your command line, you will need the gcp cli and you will need to authenticate with Google Cloud:
`gcloud auth login`
Once that's done, you need to create a service account for your project and download a key in a json file. The file should be in this root folder. Make sure you add your key file name to .gitignore. 

You also need to export an environmental variable with the path to the key file. <br />
`export GOOGLE_APPLICATION_CREDENTIALS=[PATH]` (mac) <br />
`set GOOGLE_APPLICATION_CREDENTIALS=[PATH]`(windows) <br />

### Before Deploying / Enabling trigger
The tmp folder (which is empty after cloning) does not need to contain any files. As long as you have a file in your bucket, it will work. The folder is used for editing the new image prior to uploading. Edit the name (for the file name to look for) and the bucket (for the bucket name in your project).

Once deployed to a Google Bucket, the function should run everytime a file is uploaded to the trigger bucket. Refer to the video below for more information.

### After Deploying / Enabling trigger
The function is supposed to be deployed as a Google Cloud Function. After you enable a trigger on the bucket, you will need to change the code to use local files if you wish to test locally. To run it from the terminal, uncomment the line marked in the end of the file. Add some test image files to the tmp folder. Uncomment the code to use the local image files, instead of downloading from the bucket.

### Yes, there is a bunch of console.log lines...
The console.logs are useful! When the function is deployed to a bucket, it is possible to look at the logs from the Google Cloud Console -> Operations -> Logging.

### Deploy command:
`gcloud functions deploy automask --trigger-bucket elliestestbucket --stage-bucket deployed-functions --runtime nodejs14 --entry-point maskImage`

### Far from production state!
The quality of the detection depends on the quality of the image.
As is, the function is not 100% reliable, because even though it will mask _something_ everytime, there is no guarantee that the image will be _properly_ masked. Given that the function starts masking from _left_ to _right_ and assumes and card is placed at least somewhat _horizontly_, when it cannot detect all groups of digits in the card, some unexpected masking may happen. It may, for example, mask only the first 4 digits, or place the mask awkwardly onto the numbers. I have included a couple sample fake cards taken from advertisements on the internet. They can be found in the `tmp` folder.

From the samples included, you will notice that `test-visa-gold.png`, `testcc2.jpg` and `testcc3.jpg` are the ones that work more properly, receiving a good mask. As for `testcc4.jpg` which resembles best an image uploaded by a user, it will get masked, but some of the first few digits fall out of the mask. This can be solved by extending the mask a little bit. Card `testcc5.jpg` is the most problematic picture, in which the numbers cannot be detected in groups of 4. To solve that particular problem, I have changed the matching mask to look for groups of 2 digits at a time, which made the masking work.

Of course some more tweaks can be made, and I believe it can be improved further by trying to detect the edges of card, not only the numbers, so that the mask could be placed parallel to the edges of the card.

[How to deploy the function and listen to uploads into a bucket.](https://www.youtube.com/watch?v=rzHm2wu9_LM)

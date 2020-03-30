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

Add a test file to your bucket, make note of the file name and the bucket name. The tmp folder (which is empty after cloning) does not need to contain any files. As long as you have a file in your bucket, it will work. The folder is used for editing the new image prior to uploading.

The function is supposed to be deployed as a Google Cloud Function. To run it from the terminal, uncomment the line marked in the end of the file. Edit the name (for the file name to look for) and the bucket (for the bucket name in your project).

Once deployed to a Google Bucket, the function should run everytime a file is uploaded to the trigger bucket. Refer to the video below for more information.



[How to deploy the function and listen to uploads into a bucket.](https://www.youtube.com/watch?v=rzHm2wu9_LM)

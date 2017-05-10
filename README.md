# File Transfer for Google Drive Without Authorization

# Overview
In this article, I would like to introduce how to transfer files for Google Drive under no authorization.

# Description
When we download and upload files for Google Drive, it usually has to use Drive API. In order to use Drive API, access token is required. If you want to make your friends download and upload files for your Google Drive, the authorization process is to take time. So I proposal this.

As a sample, I introduce a script for downloading and uploading files using Web Apps. In this sample, it changes a file to a byte slice and send it as text data. Then, it reconstructs it. Of course, base64 encode can be used for this. But the data size for using base64 is much larger than that for using the byte slice.

At this method, the project files including GAS script cannot be downloaded. When a script file is uploaded, it is converted to text file which is not a project file of Google. When Google Docs can be downloaded using this method, those are downloaded as PDF file. docx, pptx and xlsx can be uploaded.

They say taht the limitation size of an uploading file is 24 MBytes. [Ref.](http://stackoverflow.com/questions/38315816/max-size-for-post-request-sent-to-webapps)

# Usage
## 1. <u>[Deploy Web Apps](https://developers.google.com/apps-script/guides/web)</u>
1. Open the Script Editor.
2. On the Script Editor
    - File -> Manage Versions -> Save New Version
    - Publish -> Deploy as Web App
    - At Execute the app as, select **"your account"**
    - At Who has access to the app, select **"Anyone, even anonymous"**
    - Click "Deploy"
    - Copy **"Current web app URL"**
    - Click "OK"

## 2. Paste following script on Script Editor.

**After pasted it, please run ``doPost()`` on Google Script Editor and authorize the script at [Authorization for Google Services](https://developers.google.com/apps-script/guides/services/authorization).** This is an important point.

~~~javascript
function doPost(e) {
  if (e.parameters.method == "download") {
    try {
      return (function(id){
        var file = DriveApp.getFileById(id);
        return ContentService
              .createTextOutput(JSON.stringify({
                size: file.getBlob().getBytes(),
                name: file.getName(),
                result: file.getName() + " (" + file.getBlob().getContentType() + ")"
              }))
              .setMimeType(ContentService.MimeType.JSON);
      })(e.parameters.id);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({
                result: err.message
              }))
              .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (e.parameters.method == "upload") {
    try {
      return ContentService
              .createTextOutput(JSON.stringify({
                result: (function(p){
                  return DriveApp
                    .createFile(
                      Utilities.newBlob(
                        [parseInt(i, 10) for each (i in p.file)],
                        p.mime,
                        p.name
                      )
                    )
                    .getId();
                })(e.parameters)
              }))
              .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({
                result: err.message
              }))
              .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (e.parameters.method == "delete") {
    try {
      DriveApp.getFileById(e.parameters.id).setTrashed(true);
      return ContentService.createTextOutput(JSON.stringify({
                result: e.parameters.id + " was deleted."
              }))
              .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({
                result: err.message
              }))
              .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput("Did nothing.");
}
~~~

## 3. At local pc, use following script.
There are 3 methods of ``download()``, ``upload()`` and ``delete()``. When you use those, please give a value of file ID to``download()`` and ``delete()``. Then please give file name to ``upload()``.

~~~python
import mimetypes
import numpy as np
import requests

# Please paste "Current web app URL" here.
url = "https://script.google.com/macros/s/#####/exec"


def download(fileid):
    r = requests.post(
        url,
        data={"method": "download", "id": fileid}
    )
    if len(r.json()["name"]) > 0:
        with open(r.json()["name"], "bw") as f:
            f.write(np.array(r.json()["size"], dtype=np.uint8))
    return r.json()["result"]


def upload(filename):
    with open(filename, "rb") as f:
        d = f.read()
    r = requests.post(
        url,
        data={
            "method": "upload",
            "file": [(-(i & 0b10000000) | (i & 0b01111111)) for i in d],
            "name": filename,
            "mime": mimetypes.guess_type(filename)[0]
        }
    )
    return r.json()["result"]


def delete(fileid):
    r = requests.post(
        url,
        data={"method": "delete", "id": fileid}
    )
    return r.json()["result"]

def main():
    fileid = "#####"
    print(download(fileid))

    filename = "#####"
    print(upload(filename))

    fileid = "#####"
    print(delete(fileid))

if __name__ == '__main__':
    main()
~~~

Download files have no extension. So please add the extension for each mimeType to the files.


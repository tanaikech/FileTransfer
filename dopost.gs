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

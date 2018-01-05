function doGet(e)
{
  // podcast再生用
  notify2GoogleHome(e.parameter);
  return HtmlService.createHtmlOutputFromFile('index');
}

function doPost(e)
{
  // 音声通知用
  var url = getNgrokUrl() + '/google-home-notifier';
  var text = e.parameters.text[0];
  
  var payload =
  {
    "text" : text
  };

  var options =
  {
    "method" : "post",
    "payload" : payload
  };

  UrlFetchApp.fetch(url, options);
  
  return ContentService.createTextOutput(JSON.stringify({content:"post ok"})).setMimeType(ContentService.MimeType.JSON);
}

function notify2GoogleHome(parameter) {
  var url = getNgrokUrl() + parameter.action;
  UrlFetchApp.fetch(url);
}

function getNgrokUrl() {
  if (getNgrokUrl.instance) { return getNgrokUrl.instance; }
  var ngrokSheetId = ""; //スプレッドシートのId
  var url = SpreadsheetApp.openById(ngrokSheetId).getSheetByName("url").getDataRange().getValues()[0][0];
  return url;
}

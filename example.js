var express = require('express');
var googlehome = require('./google-home-notifier');
var ngrok = require('ngrok');
var bodyParser = require('body-parser');

var GoogleSpreadsheet = require('google-spreadsheet');
var ngrokUrlSheet = new GoogleSpreadsheet(process.env.SPREAD_KEY); //コピーしたスプレッドシートのKey
var credentials = require('./GoogleHome.json'); //作成した認証キーへのパス

var app = express();
const serverPort = 8091; // default port

var deviceName = 'Google Home';
var ip = process.env.GOOGLEHOME_IP; // default IP
var language = 'ja'; // default language code

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var sheet;
ngrokUrlSheet.useServiceAccountAuth(credentials, function(err){
   ngrokUrlSheet.getInfo(function(err, data){
      sheet = data.worksheets[0];
   });
});

var backspace = require('./backspace-rss');
var rebuild = require('./rebuild-rss');

backspace.getRss();
backspace.startCron();

rebuild.getRss();
rebuild.startCron();

app.post('/google-home-notifier', urlencodedParser, function (req, res) {
  console.log(req.body);
  if (!req.body) return res.sendStatus(400)
  
  var text = req.body.text;
  
  if (req.query.ip) {
     ip = req.query.ip;
  }

  if (req.query.language) {
    language;
  }

  notifyToGoogleHome(text, ip, language, res);
});

app.get('/google-home-notifier', function (req, res) {
  console.log(req.query);

  var text = req.query.text;

  if (req.query.ip) {
     ip = req.query.ip;
  }

  if (req.query.language) {
    language;
  }

  notifyToGoogleHome(text, ip, language, res);
});

app.get('/google-home-backspace-latest', function (req, res) {
  var text = backspace.getLatestUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});

app.get('/google-home-backspace-random', function (req, res) {
  var text = backspace.getRandomUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});


app.get('/google-home-rebuild-latest', function (req, res) {
  var text = rebuild.getLatestUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});

app.get('/google-home-rebuild-random', function (req, res) {
  var text = rebuild.getRandomUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});


function notifyToGoogleHome(text, ip, language, res){
  googlehome.ip(ip, language);
  googlehome.device(deviceName,language)

  if (text) {
    try {
      if (text.startsWith('http')){
        var mp3_url = text;
        googlehome.play(mp3_url, function(notifyRes) {
          console.log(notifyRes);
          res.send(deviceName + ' will play sound from url: ' + mp3_url + '\n');
        });
      } else {
        googlehome.notify(text, function(notifyRes) {
          console.log(notifyRes);
          res.send(deviceName + ' will say: ' + text + '\n');
        });
      }
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
      res.send(err);
    }
  }else{
    res.send('Please GET "text=Hello+Google+Home"');
  }
}

app.listen(serverPort, function () {
  ngrok.connect(serverPort, function (err, url) {
    console.log('Endpoints:');
    console.log('    http://' + ip + ':' + serverPort + '/google-home-notifier');
    console.log('    ' + url + '/google-home-notifier');
    console.log('GET example:');
    console.log('curl -X GET ' + url + '/google-home-notifier?text=Hello+Google+Home');
    console.log('curl -X GET ' + url + '/google-home-backspace-latest');
    console.log('curl -X GET ' + url + '/google-home-backspace-random');
    console.log('curl -X GET ' + url + '/google-home-rebuild-latest');
    console.log('curl -X GET ' + url + '/google-home-rebuild-random');
    console.log('POST example:');
    console.log('curl -X POST -d "text=Hello Google Home" ' + url + '/google-home-notifier');

    sheet.getCells({
      'min-row': 1,
      'max-row': 1,
      'min-col': 1,
      'max-col': 1,
      'return-empty': true
    }, function(error, cells) {
      var cell = cells[0];
      cell.value = url;
      cell.save();
      console.log('spread sheet update successful!!');
    });
  });
})

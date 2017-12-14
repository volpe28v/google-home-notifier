var express = require('express');
var googlehome = require('./google-home-notifier');
var ngrok = require('ngrok');
var bodyParser = require('body-parser');
var app = express();
const serverPort = 8091; // default port

var deviceName = 'Google Home';
var ip = '192.168.0.4'; // default IP

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var backspace = require('./backspace-rss');
var rebuild = require('./rebuild-rss');

backspace.getRss();
backspace.startCron();

rebuild.getRss();
rebuild.startCron();

app.post('/google-home-notifier', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  console.log(req.body);
  
  var text = req.body.text;
  
  if (req.query.ip) {
     ip = req.query.ip;
  }

  var language = 'ja'; // default language code
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

  var language = 'ja'; // default language code
  if (req.query.language) {
    language;
  }

  notifyToGoogleHome(text, ip, ranguage, res);
});

app.get('/google-home-backspace', function (req, res) {
  var language = 'ja'; // default language code
  var text = backspace.getLatestUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});

app.get('/google-home-backspace-random', function (req, res) {
  var language = 'ja'; // default language code
  var text = backspace.getRandomUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});


app.get('/google-home-rebuild', function (req, res) {
  var language = 'ja'; // default language code
  var text = rebuild.getLatestUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});

app.get('/google-home-rebuild-random', function (req, res) {
  var language = 'ja'; // default language code
  var text = rebuild.getRandomUrl();
  console.log(text);

  notifyToGoogleHome(text, ip, language, res);
});


function notifyToGoogleHome(text, ip, language, res){
  googlehome.ip(ip, language);
  googlehome.device(deviceName,language)　　　　　　　//ここに命令文を追加

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
    console.log('curl -X GET ' + url + '/google-home-backspace');
    console.log('curl -X GET ' + url + '/google-home-backspace-random');
    console.log('curl -X GET ' + url + '/google-home-rebuild');
    console.log('curl -X GET ' + url + '/google-home-rebuild-random');
	console.log('POST example:');
	console.log('curl -X POST -d "text=Hello Google Home" ' + url + '/google-home-notifier');
  });
})

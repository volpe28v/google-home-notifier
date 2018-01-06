var express = require('express');
var googlehome = require('./google-home-notifier');
var ngrok = require('ngrok');
var bodyParser = require('body-parser');

var GoogleSpreadsheet = require('google-spreadsheet');
var ngrokUrlSheet = new GoogleSpreadsheet(process.env.SPREAD_KEY); //コピーしたスプレッドシートのKey
var credentials = require('./GoogleHome.json'); //作成した認証キーへのパス
var storage = require('./jsonfile-storage');

var path = require('path');
var app = express();
const serverPort = 8091; // default port
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var deviceName = 'Google Home';
var ip = process.env.GOOGLEHOME_IP; // default IP
var language = 'ja'; // default language code

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var backspace = require('./backspace-rss');
var rebuild = require('./rebuild-rss');

backspace.getRss();
backspace.startCron();

rebuild.getRss();
rebuild.startCron();

var sheet;
ngrokUrlSheet.useServiceAccountAuth(credentials, function(err){
  ngrokUrlSheet.getInfo(function(err, data){
    sheet = data.worksheets[0];
    init_app();
  });
});

function init_app(){
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
    backspace.getLatestUrl().then(function(url){
      console.log(url);
      notifyToGoogleHome(url, ip, language, res);
    });
  });

  app.get('/google-home-backspace-random', function (req, res) {
    var url = backspace.getRandomUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-backspace-update', function (req, res) {
    backspace.getRss().then(function(result){
      return backspace.getLatestUrl();
    }).then(function(url){
      console.log("updated backspace.fm : " + url);
      res.send("updated backspace.fm : " + url + '\n');
    });
  });


  app.get('/google-home-rebuild-latest', function (req, res) {
    rebuild.getLatestUrl().then(function(url){
      console.log(url);
      notifyToGoogleHome(url, ip, language, res);
    });
  });

  app.get('/google-home-rebuild-random', function (req, res) {
    var url = rebuild.getRandomUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-rebuild-update', function (req, res) {
    rebuild.getRss().then(function(result){
      return rebuild.getLatestUrl();
    }).then(function(url){
      console.log("updated rebuild.fm : " + url);
      res.send("updated rebuild.fm : " + url + '\n');
    });
  });


  function notifyToGoogleHome(text, ip, language, res){
    googlehome.ip(ip, language);
    googlehome.device(deviceName,language)

    if (text) {
      try {
        if (text.startsWith('http')){
          var mp3_url = text;
          googlehome.play(mp3_url, function(notifyRes) {
            if (notifyRes.isFirst){
              res.send(deviceName + ' will play sound from url: ' + mp3_url + '\n');
            }else{
              var status = notifyRes.body;
              console.log(status.playerState);
              var remain = Math.ceil((status.media.duration - status.currentTime) / 60);

              console.log(status.media.contentId + " : " + status.currentTime + " / " + status.media.duration + "  残り" + remain + "分");
              storage.setBeforeTime(status.media.contentId, status.currentTime, status.media.duration);
            }
          });
        } else {
          googlehome.notify(text, function(notifyRes) {
            if (notifyRes.isFirst){
              res.send(deviceName + ' will say: ' + text + '\n');
            }
          });
        }
      } catch(err) {
        console.log(err);
        //res.sendStatus(500);
        //res.send(err);
      }
    }else{
      res.send('Please GET "text=Hello+Google+Home"');
    }
  }

  app.get('/podcast-data', function (req, res) {
    var data = {};
    data.rebuild = rebuild.getProgress();
    data.backspace = backspace.getProgress();
    
    res.send(data);
  });

  app.get('/podcast-play', function (req, res) {
    notifyToGoogleHome(req.query.url, ip, language, res);
  });

  app.listen(serverPort, function (err) {
    if (err) console.log(err);
    ngrok.connect(serverPort, function (err, url) {
      if (err) console.log(err);

      console.log('Endpoints:');
      console.log('    http://' + ip + ':' + serverPort + '/google-home-notifier');
      console.log('    ' + url + '/google-home-notifier');
      console.log('GET example:');
      console.log('curl -X GET ' + url + '/google-home-notifier?text=Hello+Google+Home');
      console.log('curl -X GET ' + url + '/google-home-backspace-latest');
      console.log('curl -X GET ' + url + '/google-home-backspace-random');
      console.log('curl -X GET ' + url + '/google-home-backspace-update');
      console.log('curl -X GET ' + url + '/google-home-rebuild-latest');
      console.log('curl -X GET ' + url + '/google-home-rebuild-random');
      console.log('curl -X GET ' + url + '/google-home-rebuild-update');
      console.log('curl -X GET ' + url + '/podcast-data');
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
  });
}

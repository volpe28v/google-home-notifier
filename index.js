var express = require('express');
var googlehome = require('./google-home-notifier');
var bodyParser = require('body-parser');

var path = require('path');
var app = express();
var server = require('http').createServer(app);

var io = require('socket.io').listen(server,{ 'destroy buffer size': Infinity });
io.sockets.on('connection', function(client) {
  console.log("New Connection from " + client.client.id);
  updatePodcastData(client);
});

function updatePodcastData(client){
  var podcastList = [];
  podcastList.push({
    title: "Rebuild.fm",
    items: rebuild.getProgress()
  });

  podcastList.push({
    title: "Backspace.fm",
    items: backspace.getProgress()
  });

  /*
  podcastList.push({
    title: "CNN",
    items: english_podcast[0].getProgress()
  });

  podcastList.push({
    title: "CBS",
    items: english_podcast[1].getProgress()
  });
  */

  client.emit('data', podcastList);
}

const serverPort = 8091; // default port
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var deviceName = 'Google Home';
var ip = process.env.GOOGLEHOME_IP;
var language = 'ja'; // default language code

var audio_ip = process.env.AUDIO_IP;

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var storage = require('./jsonfile-storage');
var backspace = require('./backspace-rss');
var rebuild = require('./rebuild-rss');

backspace.setHandlers({
  onUpdated: function(){
    updatePodcastData(io.sockets);
  }
});
backspace.getRss();
backspace.startCron();

rebuild.setHandlers({
  onUpdated: function(){
    updatePodcastData(io.sockets);
  }
});
rebuild.getRss();
rebuild.startCron();

var english_podcast = [];
english_podcast.push(require('./cnn-rss'));
english_podcast.push(require('./cbs-rss'));
//english_podcast.push(require('./pbs-rss'));  //レスポンス悪いので一旦コメント

english_podcast.forEach(function(ep){
  ep.getRss();
  ep.startCron();
});

if (process.env.SPREAD_KEY){
  var GoogleSpreadsheet = require('google-spreadsheet');
  var ngrokUrlSheet = new GoogleSpreadsheet(process.env.SPREAD_KEY); //コピーしたスプレッドシートのKey
  var credentials = require('./GoogleHome.json'); //作成した認証キーへのパス

  var sheet;
  ngrokUrlSheet.useServiceAccountAuth(credentials, function(err){
    ngrokUrlSheet.getInfo(function(err, data){
      init_app().then(function(url){
        sheet = data.worksheets[0];
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
  });
}else{
  init_app();
}

function init_app(){
  app.post('/google-home-notifier', urlencodedParser, function (req, res) {
    console.log(req.body);
    if (!req.body) return res.sendStatus(400)

    var text = req.body.text;

    if (req.body.ip) {
      ip = req.body.ip;
    }

    var isJapanese = false;
    for (var i = 0; i < text.length; ++i) {
      if (text.charCodeAt(i) >= 256) {
        isJapanese = true;
        break;
      }
    }

    const language = isJapanese ? 'ja' : 'en';

    notifyToGoogleHome(text, ip, language, res);
  });

  app.get('/google-home-notifier', function (req, res) {
    console.log(req.query);

    var text = req.query.text;

    if (req.query.ip) {
      ip = req.query.ip;
    }

    if (req.query.language) {
      language = req.query.language;
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

  app.get('/google-home-backspace-resume', function (req, res) {
    var url = backspace.getResumeUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-backspace-update', function (req, res) {
    backspace.getRss().then(function(result){
      console.log("updated backspace.fm ");
      updatePodcastData(io.sockets);
      res.send("updated backspace.fm ");
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

  app.get('/google-home-rebuild-resume', function (req, res) {
    var url = rebuild.getResumeUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });


  app.get('/google-home-rebuild-update', function (req, res) {
    rebuild.getRss().then(function(result){
      console.log("updated rebuild.fm ");
      updatePodcastData(io.sockets);
      res.send("updated rebuild.fm ");
    });
  });

  app.get('/google-home-english-latest', function (req, res) {
    var randomItems = english_podcast.concat();

    // ランダムソート
    for(var i = randomItems.length - 1; i > 0; i--){
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = randomItems[i];
      randomItems[i] = randomItems[r];
      randomItems[r] = tmp;
    }
 
    randomItems[0].getLatestUrl().then(function(url){
      console.log(url);
      notifyToGoogleHome(url, ip, language, res);
    });
  });

  // オーディオ再生機能
  app.get('/google-home-audio', function (req, res) {
    if (audio_ip){
      console.log(req.query);
      var mp3_file = req.query.mp3.trim();
      notifyToGoogleHome('http://' + audio_ip + '/' + mp3_file, ip, language, res);
    }else{
      console.log('undefined env AUDIO_IP');
    }
  });
  
  function notifyToGoogleHome(text, ip, language, res){
    googlehome.ip(ip, language);
    googlehome.device(deviceName,language)

    if (text) {
      try {
        if (text.startsWith('http')){
          var mp3_url = text;
          googlehome.play(mp3_url, function(notifyRes) {
            var status = notifyRes.body;

            if (notifyRes.isFirst){
              res.send(deviceName + ' will play sound from url: ' + mp3_url + '\n');
            }else{
              console.log(status.playerState);
              var remain = Math.ceil((status.media.duration - status.currentTime) / 60);

              console.log(status.media.contentId + " : " + status.currentTime + " / " + status.media.duration + "  残り" + remain + "分");
              storage.setBeforeTime(status.media.contentId, status.currentTime, status.media.duration);

            }

            io.sockets.emit('progress', {url: mp3_url, time: status.currentTime});
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

  return new Promise(function(resolve, reject){
    server.listen(serverPort, function (err) {
      if (err) console.log(err);
      var url = "http://localhost";

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
      console.log('curl -X GET ' + url + '/google-home-english-latest');
      console.log('curl -X GET ' + url + '/podcast-data');
      console.log('POST example:');
      console.log('curl -X POST -d "text=Hello Google Home" ' + url + '/google-home-notifier');

      resolve(url);
    });
  });
}

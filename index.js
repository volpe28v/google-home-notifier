var express = require('express');
var googlehome = require('./lib/google-home-notifier');
var bodyParser = require('body-parser');

var path = require('path');
var app = express();
var server = require('http').createServer(app);

var io = require('socket.io').listen(server,{ 'destroy buffer size': Infinity });
io.sockets.on('connection', function(client) {
  console.log("New Connection from " + client.client.id);
  updatePodcastData(client);
});

const serverPort = 8091; // default port
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var deviceName = 'Google Home';
var ip = process.env.GOOGLEHOME_IP;
var language = 'ja'; // default language code

var audio_ip = process.env.AUDIO_IP;

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var RssReader = require('./lib/rss-reader');
var storage = require('./lib/jsonfile-storage');
var jsonfile = require('jsonfile');

var podcastJson= jsonfile.readFileSync('./podcast-list.json', {
  encoding: 'utf-8',
  reviver: null,
  throws: true
});

var rssReaderList = podcastJson.map(function(p){
  var reader = new RssReader(p);
  reader.setHandlers({
    onUpdated: function(){
      updatePodcastData(io.sockets);
    }
  });
  reader.getRss();
  reader.startCron("0 0 0 * * *");
  return reader;
});

function updatePodcastData(client){
  client.emit(
    'data',
    rssReaderList.map(function(rr){
      return {
        title: rr.title,
        items: rr.getProgress()
      }
    })
  );
}

init_app();

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

  app.get('/google-home-podcast-latest', function (req, res) {
    var target = req.query.target;

    var podcast = rssReaderList.filter(function(rr){
      return rr.title.toLowerCase() == target.toLowerCase();
    })[0];

    var url = podcast.getLatestUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-podcast-random', function (req, res) {
    var target = req.query.target;
    var podcast = rssReaderList.filter(function(rr){
      return rr.title.toLowerCase() == target.toLowerCase();
    })[0];

    var url = podcast.getRandomUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-podcast-resume', function (req, res) {
    var target = req.query.target;
    var podcast = rssReaderList.filter(function(rr){
      return rr.title.toLowerCase() == target.toLowerCase();
    })[0];

    var url = podcast.getResumeUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-podcast-update', function (req, res) {
    var target = req.query.target;
    var podcast = rssReaderList.filter(function(rr){
      return rr.title.toLowerCase() == target.toLowerCase();
    })[0];

    podcast.getRss().then(function(result){
      console.log("updated " + target);
      updatePodcastData(io.sockets);
      res.send("updated " + target);
    });
  });

  app.get('/google-home-podcast-latest-by-type', function (req, res) {
    var target = req.query.target;
    var randomItems = rssReaderList.filter(function(rr){
      return rr.type.toLowerCase() == target.toLowerCase();
    });

    // ランダムソート
    for(var i = randomItems.length - 1; i > 0; i--){
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = randomItems[i];
      randomItems[i] = randomItems[r];
      randomItems[r] = tmp;
    }
 
    var url = randomItems[0].getLatestUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
  });

  app.get('/google-home-podcast-random-by-type', function (req, res) {
    var target = req.query.target;
    var podcast = rssReaderList.filter(function(rr){
      return rr.type.toLowerCase() == target.toLowerCase();
    })[0];

    var url = podcast.getRandomUrl();
    console.log(url);

    notifyToGoogleHome(url, ip, language, res);
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

              io.sockets.emit('progress', {url: mp3_url, time: status.currentTime, duration: status.media.duration});
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

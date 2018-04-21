var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');
var storage = require('./jsonfile-storage');
var browser = mdns.createBrowser(mdns.tcp('googlecast'));
var deviceAddress;
var language;

var device = function(name, lang = 'ja') {
    device = name;
    language = lang;
    return this;
};

var ip = function(ip) {
  deviceAddress = ip;
  return this;
}

var googletts = require('google-tts-api');
var googlettsaccent = 'us';
var accent = function(accent) {
  googlettsaccent = accent;
  return this;
}

var notify = function(message, callback) {
  if (!deviceAddress){
    browser.start();
    browser.on('serviceUp', function(service) {
      console.log('Device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.name.includes(device.replace(' ', '-'))){
        deviceAddress = service.addresses[0];
        getSpeechUrl(message, deviceAddress, function(res) {
          callback(res);
        });
      }
      browser.stop();
    });
  }else {
    getSpeechUrl(message, deviceAddress, function(res) {
      callback(res);
    });
  }
};

var play = function(mp3_url, callback) {
  if (!deviceAddress){
    browser.start();
    browser.on('serviceUp', function(service) {
      console.log('Device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.name.includes(device.replace(' ', '-'))){
        deviceAddress = service.addresses[0];
        getPlayUrl(mp3_url, deviceAddress, function(res) {
          callback(res);
        });
      }
      browser.stop();
    });
  }else {
    getPlayUrl(mp3_url, deviceAddress, function(res) {
      callback(res);
    });
  }
};

var getSpeechUrl = function(text, host, callback) {
  googletts(text, language, 1, 1000, googlettsaccent).then(function (url) {
    onDeviceUp(host, url, function(res){
      callback(res)
    });
  }).catch(function (err) {
    console.error(err.stack);
  });
};

var getPlayUrl = function(url, host, callback) {
    onDeviceUp(host, url, function(res){
      callback(res)
    });
};

var statusTimer = null;

var onDeviceUp = function(host, url, callback) {
  stopProgressTimer();

  var client = new Client();
  client.connect(host, function() {
    client.launch(DefaultMediaReceiver, function(err, player) {
      var media = {
        contentId: url,
        contentType: 'audio/mp3',
        //streamType: 'BUFFERED' // or LIVE
        streamType: 'LIVE' // or LIVE
      };

      player.on('status', function(status) {
        switch(status.playerState){
          case 'PLAYING':
            startProgressTimer(player, callback);
            break;

          case 'PAUSED':
            stopProgressTimer();
            break;
        }
      });

      player.load(media, { autoplay: true }, function(err, status) {
        var beforeTime = storage.getBeforeTime(media.contentId);
        if (beforeTime > 0){
          player.seek(beforeTime, function(err, status) {
            callback({isFirst: true, body: { currentTime: beforeTime}});
          });
          return;
        }

        callback({isFirst: true, body: { currentTime: 0}});
      });
    });
  });

  client.on('error', function(err) {
    console.log('Error: %s', err.message);
    client.close();
  });
};

function startProgressTimer(player, callback){
  if (statusTimer != null) return;

  statusTimer = setTimeout(function(){
    stopProgressTimer();

    player.getStatus(function(err, status){
      if (status == null){
        clearInterval(statusTimer);
        statusTimer = null;
        return;
      }

      callback({isFirst: false, body: status});

      switch(status.playerState){
        case 'PLAYING':
          startProgressTimer(player, callback);
          break;

        case 'PAUSED':
          stopProgressTimer();
          break;
      }
    });
  }, 5*1000);
}
 
function stopProgressTimer(){
  if (statusTimer){
    clearInterval(statusTimer);
    statusTimer = null;
  }
}

exports.ip = ip;
exports.device = device;
exports.accent = accent;
exports.notify = notify;
exports.play = play;

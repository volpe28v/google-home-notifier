var request = require("request");
var CronJob = require('cron').CronJob;

var RssUrl = 'http://feeds.backspace.fm/backspacefm';

var mp3Urls = [];

module.exports.startCron = function(){
  var cronTime = '30 0 * * * *';

  new CronJob({
    cronTime: cronTime,
    start: true,
    onTick: function () {
      module.exports.getRss();
    }
  });
}

module.exports.getRss = function(){
  request.get({
    url: RssUrl
  }, function(error, reaponse, body){
    var lines = body.split("\n");

    mp3Urls = lines.filter(function(line){
      return line.match(/enclosure/);
    })
    .map(function(line){
      return line.split('"')[1];
    });

    console.log(mp3Urls.length);
    console.log(module.exports.getLatestUrl());
  });
}

module.exports.getLatestUrl = function(){
  if (mp3Urls.length == 0){
    return null;
  }

  return mp3Urls[0];
}


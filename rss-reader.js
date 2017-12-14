var request = require("request");
var CronJob = require('cron').CronJob;

function RssReader(url){
  var self = this;

  this.url = url;
  this.mp3Urls = [];

  this.startCron = function(pattern){
    new CronJob({
      cronTime: pattern,
      start: true,
      onTick: function () {
        self.getRss();
      }
    });
  }

  this.getRss = function(){
    request.get({
      url: self.url
    }, function(error, reaponse, body){
      var lines = body.split("\n");

      self.mp3Urls = lines.filter(function(line){
        return line.match(/enclosure/);
      })
        .map(function(line){
          return line.split('"')[1];
        });

      console.log(self.mp3Urls.length);
      console.log(self.getLatestUrl());
    });
  }

  this.getLatestUrl = function(){
    if (self.mp3Urls.length == 0){
      return null;
    }

    return self.mp3Urls[0];
  }

  this.getRandomUrl = function(){
    if (self.mp3Urls.length == 0){
      return null;
    }

    return self.mp3Urls[Math.floor( Math.random() * self.mp3Urls.length )];
  }
}

module.exports = RssReader;

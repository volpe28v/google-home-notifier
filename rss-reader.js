var request = require("request");
var CronJob = require('cron').CronJob;
var parser = require('xml2json');
var jsonfile = require('jsonfile');
var moment = require('moment');
var storage = require('./jsonfile-storage');

function RssReader(url){
  var self = this;

  this.url = url;
  this.items = [];

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
    return new Promise(function(resolve, reject){
      request.get({
        url: self.url
      }, function(error, reaponse, body){
        var json = parser.toJson(body);

        self.items = JSON.parse(json).rss.channel.item.map(function(item){
          return {
            date: moment(item.pubDate),
            url: item.enclosure.url,
            duration: toSeconds(item["itunes:duration"])
          };
        });

        //console.log(self.items);
        console.log(self.url + " " + self.items.length + " episodes.");
        console.log("\tlatest " + self.getLatestUrl());
        
        resolve();
      });
    });
  }

  this.getLatestUrl = function(){
    if (self.items.length == 0){
      return null;
    }

    // 未再生の最新を検索する
    for (var i = 0; i < self.items.length; i++){
      if (!storage.isFinished(self.items[i].url)){
        return self.items[i].url;
      }
    }
    return null;
  }

  this.getRandomUrl = function(){
    if (self.items.length == 0){
      return null;
    }

    var randomItems = self.items.concat();

    // ランダムソート
    for(var i = randomItems.length - 1; i > 0; i--){
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = randomItems[i];
      randomItems[i] = randomItems[r];
      randomItems[r] = tmp;
    }

    // 未再生を検索
    for (var i = 0; i < randomItems.length; i++){
      if (!storage.isFinished(randomItems[i].url)){
        return randomItems[i].url;
      }
    }

    return null;
  }
}

function toSeconds(duration){
  var elems = duration.split(":");
  switch(elems.length){
    case 2: // mm:ss
      return Number(elems[0]) * 60 + Number(elems[1]);

    case 3: // hh:mm:ss
      return Number(elems[0]) * 3600 + Number(elems[1]) * 60 + Number(elems[2]);
  }
}

module.exports = RssReader;

var request = require("request");
var CronJob = require('cron').CronJob;
var parser = require('xml2json');
var moment = require('moment');
var storage = require('../lib/jsonfile-storage');

function RssReader(podcast){
  var self = this;

  this.title = podcast.title;
  this.url = podcast.url;
  this.resumeUrl = null;
  this.items = [];
  this.handlers = {
    onUpdated: function(){}
  }

  this.setHandlers = function(handlers){
    self.handlers = handlers;
  }
  
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
        try{
          var json = parser.toJson(body);

          self.items = JSON.parse(json).rss.channel.item.map(function(item){
            return {
              date: moment(item.pubDate),
            title: item.title,
            link: item.link,
            url: item.enclosure.url,
            duration: toSeconds(item["itunes:duration"]),
            description: item.description
            };
          });

          //console.log(self.items);
          console.log(self.url + " " + self.items.length + " episodes.");

          self.handlers.onUpdated();
          resolve();
        }catch(e) {
          console.log(e);
          reject();
        }
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
        return self.resumeUrl = self.items[i].url;
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
        return self.resumeUrl = randomItems[i].url;
      }
    }

    return null;
  }

  this.getProgress = function(){
    for (var i = 0; i < self.items.length; i++){
      var item = storage.getItem(self.items[i].url);
      if (item != null){
        self.items[i].time = item.time;
        self.items[i].duration = item.duration;
      }else{
        self.items[i].time = 0;
      }
    }

    return self.items;
  }

  this.getResumeUrl = function(){
    if (self.resumeUrl != null && !storage.isFinished(self.resumeUrl)){
      return self.resumeUrl;
    }else{
      return self.getRandomUrl();
    }
  }
}

function toSeconds(duration){
  if (duration == null) return 3600; // 不明な場合は仮で60分

  var elems = duration.split(":");
  switch(elems.length){
    case 2: // mm:ss
      return Number(elems[0]) * 60 + Number(elems[1]);

    case 3: // hh:mm:ss
      return Number(elems[0]) * 3600 + Number(elems[1]) * 60 + Number(elems[2]);
  }
}

module.exports = RssReader;

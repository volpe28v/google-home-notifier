var request = require("request");
var CronJob = require('cron').CronJob;
var parser = require('xml2json');
var jsonfile = require('jsonfile');
var moment = require('moment');

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

    return self.items[0].url;
  }

  this.getRandomUrl = function(){
    if (self.items.length == 0){
      return null;
    }

    return self.items[Math.floor( Math.random() * self.items.length )].url;
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

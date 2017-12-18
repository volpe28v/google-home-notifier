var RssReader = require('./rss-reader');

var RssUrl = 'http://feeds.rebuild.fm/rebuildfm';

var rssReader = new RssReader(RssUrl);

module.exports.startCron = function(){
  var cronTime = '0 0 0 * * *';
  rssReader.startCron(cronTime);
}

module.exports.getRss = function(){
  rssReader.getRss();
}

module.exports.getLatestUrl = function(){
  return new Promise(function(resolve, reject){
    resolve(rssReader.getLatestUrl());
  });
}

module.exports.getRandomUrl = function(){
  return rssReader.getRandomUrl();
}

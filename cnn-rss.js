var RssReader = require('./rss-reader');

var RssUrl = 'http://rss.cnn.com/services/podcasting/ac360audio/rss';

var rssReader = new RssReader(RssUrl);

module.exports.setHandlers = function(handlers){
  rssReader.setHandlers(handlers);
}

module.exports.startCron = function(){
  var cronTime = '29 0 0 * * *';
  rssReader.startCron(cronTime);
}

module.exports.getRss = function(){
  return rssReader.getRss();
}

module.exports.getLatestUrl = function(){
  return new Promise(function(resolve, reject){
    resolve(rssReader.getLatestUrl());
  });
}

module.exports.getRandomUrl = function(){
  return rssReader.getRandomUrl();
}

module.exports.getProgress = function(){
  return rssReader.getProgress();
}


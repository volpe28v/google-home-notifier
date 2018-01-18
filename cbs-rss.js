var RssReader = require('./rss-reader');

var RssUrl = 'http://cbsradionewsfeed.com/rss.php?id=149&ud=12';

var rssReader = new RssReader(RssUrl);

module.exports.setHandlers = function(handlers){
  rssReader.setHandlers(handlers);
}

module.exports.startCron = function(){
  var cronTime = '28 0 0 * * *';
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


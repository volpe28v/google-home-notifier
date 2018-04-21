var RssReader = require('./rss-reader');

var RssUrl = 'https://www.pbs.org/newshour/feeds/rss/podcasts/show';

var rssReader = new RssReader(RssUrl);

module.exports.setHandlers = function(handlers){
  rssReader.setHandlers(handlers);
}

module.exports.startCron = function(){
  var cronTime = '27 0 0 * * *';
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


var RssReader = require('./rss-reader');

var RssUrl = 'http://feeds.backspace.fm/backspacefm';

var rssReader = new RssReader(RssUrl);

module.exports.startCron = function(){
  var cronTime = '30 0 0 * * *';
  rssReader.startCron(cronTime);
}

module.exports.getRss = function(){
  rssReader.getRss();
}

module.exports.getLatestUrl = function(){
  return rssReader.getLatestUrl();
}

module.exports.getRandomUrl = function(){
  return rssReader.getRandomUrl();
}

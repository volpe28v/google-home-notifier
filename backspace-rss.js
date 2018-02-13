var RssReader = require('./rss-reader');

var RssUrl = 'http://feeds.backspace.fm/backspacefm';

var rssReader = new RssReader(RssUrl);
var resumeUrl = null;

module.exports.setHandlers = function(handlers){
  rssReader.setHandlers(handlers);
}

module.exports.startCron = function(){
  var cronTime = '30 0 0 * * *';
  rssReader.startCron(cronTime);
}

module.exports.getRss = function(){
  return rssReader.getRss();
}

module.exports.getLatestUrl = function(){
  return new Promise(function(resolve, reject){
    resumeUrl = rssReader.getLatestUrl();
    resolve(resumeUrl);
  });
}

module.exports.getRandomUrl = function(){
  return resumeUrl = rssReader.getRandomUrl();
}

module.exports.getResumeUrl = function(){
  return resumeUrl;
}

module.exports.getProgress = function(){
  return rssReader.getProgress();
}


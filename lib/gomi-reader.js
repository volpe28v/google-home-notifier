var client = require('cheerio-httpcli');

function GomiReader(city, area){
  var url = 'http://www.53cal.jp/areacalendar/?city=' + city + '&area=' + area;
  this.get = function(){
    return new Promise(function(resolve, reject){
      if (city == null || area == null){
        reject();
        return;
      }

      client.fetch(url, {}, function (err, $, res, body) {
        var gomi_text = $('.today').text().trim();

        console.log(gomi_text);
        resolve(gomi_text);
      }); 
    });
  }
}

module.exports = GomiReader;

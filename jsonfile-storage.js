var jsonfile = require('jsonfile');

var FileName = 'podcast.json';

module.exports.getBeforeTime = function(url){
  try{
    var json = jsonfile.readFileSync(FileName, {
      encoding: 'utf-8',
      reviver: null,
      throws: true
    });

    var item = json.filter(function(item){
      if (item.url == url) return true;
    });
    if (item.length > 0){
      return item[0].time;
    }else{
      return 0;
    }
  }catch(e){
    return 0;
  }
}

module.exports.setBeforeTime = function(url, time){
  var json = null;
  try{
    json = jsonfile.readFileSync(FileName, {
      encoding: 'utf-8',
      reviver: null,
      throws: true
    });

    var item = json.filter(function(item){
      if (item.url == url) return true;
    });
    if (item.length > 0){
      item[0].time = time;
    }else{
      json.push({url: url, time: time});
    }
  }catch(e){
    json = [{url: url, time: time}];
  }

  jsonfile.writeFileSync(FileName, json, {
    encoding: 'utf-8',
    replacer: null,
    spaces: 2 
  });
}



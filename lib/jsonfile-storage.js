var jsonfile = require('jsonfile');

var FileName = 'podcast.json';

module.exports.getItem = function(url){
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
      return item[0];
    }else{
      return null;
    }
  }catch(e){
    return null;
  }
}

module.exports.setBeforeTime = function(url, time, duration){
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
      json.push({url: url, time: time, duration: duration});
    }
  }catch(e){
    json = [{url: url, time: time, duration: duration}];
  }

  jsonfile.writeFileSync(FileName, json, {
    encoding: 'utf-8',
    replacer: null,
    spaces: 2 
  });
}

module.exports.isFinished = function(url){
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
      var aItem = item[0];
      if (aItem.duration){
        if (aItem.duration < aItem.time + 20){
          // ほぼ最後の場合は終了とみなす
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
    }else{
      return false;
    }
  }catch(e){
    return false;
  }
}


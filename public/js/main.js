var axios = require("axios");
var _ = require('lodash');
var moment = require('moment');

var socket = require('socket.io-client')('/', {});

socket.on('connect', function() {
  console.log("connected socket.io");
});

var router = new VueRouter({
  mode: 'history',
  routes: []
});

new Vue({
  router: router,
  el: '#app',
  data: function(){
    return {
      loading: true,
      message: "",
      keyword: "",
      fixedKeyword: "",
      current_item: {
        title: "",
        link: "",
        time: 0,
        duration: 0,
      },
      podcastList: [],
    }
  },

  mounted: function(){
    var self = this;

    socket.on("data", function(data){
      self.podcastList = data;
      self.podcastList.forEach(function(podcast){
        podcast.abstract = self.getAbstract(podcast.items);
      });

      self.loading = false;
    });

    socket.on("progress", function(data){
      self.podcastList.forEach(function(podcast){
        var found_item = podcast.items.filter(function(item){
          return item.url === data.url;
        })[0];
        if (found_item){
          found_item.time = data.time;
          self.current_item = found_item;
        }
        podcast.abstract = self.getAbstract(podcast.items);
      });
    });
  },

  watch: {
    message: function(val){
      console.log(val);
    },
    keyword: function(val){
      this.search();
    },
  },

  computed: {
    filteredList: function(){
      var self = this;
      var keyword = self.fixedKeyword.toLowerCase();

      return self.podcastList.map(function(podcast){
        var filteredItems = podcast.items.filter(function(item){
          if (self.fixedKeyword == ""){
            return true;
          }else{
            return item.title.toLowerCase().match(keyword) ||
              item.description.toLowerCase().match(keyword);
          }
        });

        return {
          title: podcast.title,
          abstract: self.getAbstract(filteredItems),
          items: filteredItems
        }
      });
    },
  },

  methods: {
    itemClass: function(item){
      if (item.duration - item.time < 60){
        return "complete";
      }else if (item.time > 0){
        return "during";
      }else{
        return "noplay";
      }
    },

    getAbstract: function(items){
      var abst = {
        noplay: 0,
        during: 0,
        complete: 0,
        time: 0,
        duration: 0,
      }

      var time = 0;
      var duration = 0;
      items.forEach(function(item){
        if (item.duration - item.time < 60){
          abst.complete++;
        }else if (item.time > 0){
          abst.during++;
        }else{
          abst.noplay++;
        }
        time += item.time;
        duration += item.duration;
      });

      abst.time = time;
      abst.duration = duration;
      return abst;
    },

    play: function(item){
      var self = this;

      return new Promise(function(resolve, reject){
        self.message = "play " + item.title;

        axios.get('/podcast-play', {params:{ url: item.url}})
          .then(function (response) {
            self.message = "";
            resolve();
          })
          .catch(function (error) {
            self.message = "play error.";
            reject();
          });
      });
    },

    showRemain: function(item){
      var remain = (item.duration - item.time)/60;
      if (remain < 0) remain = 0;

      return this.paddingZero(remain/60) + ":" + this.paddingZero(remain%60);
    },

    showTotal: function(item){
      var total = item.duration/60;
      return this.paddingZero(total/60) + ":" + this.paddingZero(total%60);
    },

    showDate: function(item){
      return moment(item.date).format('YYYY.MM.DD');
    },

    paddingZero: function(num){
      var numStr = parseInt(num) + "";
      return numStr.length > 2 ? numStr : ('00' + numStr).slice(-2);
    },

    search: _.debounce(
      function () {
        this.fixedKeyword = this.keyword;
      },
      500
    )
  }
});

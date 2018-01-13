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
      message: "",
      keyword: "",
      fixedKeyword: "",
      current_item: {
        title: "",
        link: "",
        time: 0,
        duration: 0,
      },
      data: {
        rebuild: [],
        backspace: []
      },
      abstract: {
        rebuild: {
          noplay: 0,
          during: 0,
          complete: 0,
          time: 0,
          duration: 0,
        },
        backspace: {
          noplay: 0,
          during: 0,
          complete: 0,
          time: 0,
          duration: 0,
        }
      },
 
    }
  },

  mounted: function(){
    var self = this;

    socket.on("data", function(data){
      self.data = data;
      self.abstract.rebuild = self.getAbstract(self.data.rebuild);
      self.abstract.backspace = self.getAbstract(self.data.backspace);
    });

    socket.on("progress", function(data){
      // rebuild
      var rebuild_found = self.data.rebuild.filter(function(item){
        return item.url === data.url;
      })[0];
      if (rebuild_found){
        rebuild_found.time = data.time;
        self.current_item = rebuild_found;
      }
      self.abstract.rebuild = self.getAbstract(self.data.rebuild);

      // backspace
      var backspace_found = self.data.backspace.filter(function(item){
        return item.url === data.url;
      })[0];
      if (backspace_found){
        backspace_found.time = data.time;
        self.current_item = backspace_found;
      }
      self.abstract.backspace = self.getAbstract(self.data.backspace);
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
    rebuildList: function(){
      var self = this;
      var keyword = self.fixedKeyword.toLowerCase();
      return this.data.rebuild.filter(function(item){
        if (self.fixedKeyword == ""){
          return true;
        }else{
          return item.title.toLowerCase().match(keyword) ||
                 item.description.toLowerCase().match(keyword);
        }
      });
    },
    backspaceList: function(){
      var self = this;
      var keyword = self.fixedKeyword.toLowerCase();
      return this.data.backspace.filter(function(item){
        if (self.fixedKeyword == ""){
          return true;
        }else{
          return item.title.toLowerCase().match(keyword) ||
                 item.description.toLowerCase().match(keyword);
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

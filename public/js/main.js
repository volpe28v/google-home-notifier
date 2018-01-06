var axios = require("axios");

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
          remain: 0,
          total: 0,
        },
        backspace: {
          noplay: 0,
          during: 0,
          complete: 0,
          remain: 0,
          total: 0,
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
    }
  },

  computed: {
  },

  methods: {
    itemClass: function(item){
      if (item.duration - item.time < 20){
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
        remain: 0,
        total: 0,
      }

      var remain = 0;
      var total = 0;
      items.forEach(function(item){
        if (item.duration - item.time < 20){
          abst.complete++;
        }else if (item.time > 0){
          abst.during++;
          remain += item.duration - item.time;
        }else{
          abst.noplay++;
          remain += item.duration;
        }
        total += item.duration;
      });

      abst.remain = parseInt(remain/60);
      abst.total = parseInt(total/60);
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

    }
  }
});

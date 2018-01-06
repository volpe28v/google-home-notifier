var axios = require("axios");

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
    this.reload();
  },

  watch: {
    message: function(val){
      console.log(val);
    }
  },

  computed: {
  },

  methods: {
    reload: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        self.message = "now loading...";

        axios.get('/podcast-data', {})
          .then(function (response) {
            console.log(response);
            self.message = "";
            self.data = response.data;
            self.abstract.rebuild = self.getAbstract(self.data.rebuild);
            self.abstract.backspace = self.getAbstract(self.data.backspace);
            resolve();
          })
          .catch(function (error) {
            self.message = "load error.";
            reject();
          });
      });
    },

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

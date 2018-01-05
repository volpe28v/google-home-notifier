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
    }
  }
});

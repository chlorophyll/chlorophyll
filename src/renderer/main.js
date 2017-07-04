import Vue from 'vue';
import App from './App';
import Chlorophyll from 'chl/init';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>',
}).$mount('#app');

Chlorophyll.init();
Chlorophyll.animate();

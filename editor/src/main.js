import '@/style/litegui.css';
import '@/style/litegui-chlorophyll.css';
import '@/style/chlorophyll.css';
import '@/style/material-icons.css';

import Vue from 'vue';
import Chlorophyll from 'chl/init';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));

Vue.config.productionTip = false;

Chlorophyll.init();
Chlorophyll.animate();

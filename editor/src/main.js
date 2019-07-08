import '@/style/chlorophyll.css';
import '@/style/material-icons.css';
import '@/style/controlpanel.scss';

import Vue from 'vue';
import 'chl/patches';
import 'chl/vue/register';

import initMenu from 'chl/menu';


import RootComponent from '@/components/root';

import viewports from 'chl/viewport';

/*
 * Electron config
 */
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
if (!process.env.IS_WEB) Vue.use(require('vue-electron'));

Vue.config.productionTip = false;
initMenu();
new Vue(RootComponent).$mount('#app');

function animate() {
    viewports.renderAll();
    window.requestAnimationFrame(animate);
}

animate();

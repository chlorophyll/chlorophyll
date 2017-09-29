import '@/style/litegui.css';
import '@/style/litegui-chlorophyll.css';
import '@/style/chlorophyll.css';
import '@/style/material-icons.css';
import '@/style/controlpanel.scss';

import Vue from 'vue';
import 'chl/patches';
import 'chl/vue/register';

import initMenu from 'chl/menu';


import RootComponent from '@/components/root';

import { importNewModel } from 'chl/model';
import { initRenderer, initClippingPlanes, renderViewport } from 'chl/viewport';

import chrysanthemum from 'models/chrysanthemum'; // TODO proper loader

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));

Vue.config.productionTip = false;
initMenu();
initRenderer();
new Vue(RootComponent).$mount('#app');
initClippingPlanes();

function animate() {
    renderViewport();
    window.requestAnimationFrame(animate);
}

animate();

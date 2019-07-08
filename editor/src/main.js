/*
 * Stylesheets
 */
import '@/style/chlorophyll.css';
import '@/style/material-icons.css';
import '@/style/controlpanel.scss';

/*
 * UI Components
 */
import Vue from 'vue';
import 'chl/patches';
import 'chl/vue/register';
import RootComponent from '@/components/root';

/*
 * Services / state managers
 */
import initMenu from 'chl/menu';
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

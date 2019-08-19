import Vue from 'vue'
import Router from 'vue-router'
import PatternList from './views/PatternList.vue';
import Parameters from './views/Parameters.vue';
import Settings from './views/Settings.vue';
import Login from './views/Login.vue';

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'pattern-list',
      component: PatternList
    },
    {
      path: '/parameters',
      name: 'parameters',
      component: Parameters
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
  ]
})

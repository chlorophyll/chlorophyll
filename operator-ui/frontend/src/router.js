import Vue from 'vue'
import Router from 'vue-router'
import PatternList from './views/PatternList.vue';
import Parameters from './views/Parameters.vue';

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
  ]
})

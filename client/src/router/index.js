import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/LoginPage'
import MainApp from '@/components/MainApp'
import RoleAccess from '@/components/RoleAccess'
import navbar from '@/components/navbar'
import '../style/style.css'
import '../style/newStyle.css'
import '../style/keen-ui.min.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import GSignInButton from 'vue-google-signin-button'
Vue.config.productionTip = false
Vue.use(GSignInButton)
// import { store } from '../VuexSession'

/* eslint-disable*/
Vue.use(Router)

const User = {
  template: `
    <div><navbar /><section class="section"><div class="container is-fluid"><router-view></router-view></div></section></div>
  `
}

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login,
      meta: { Auth: false }
    },
    {
      path: '/navbar',
      name: 'Navbar',
    //   template: '<div><section class="section"><div class="container is-fluid"><router-view></router-view></div></section></div>',
      component: navbar,
      meta: { Auth: false },
      children: [
          {
              path: 'mainapp',
            name: 'MainApp',
              component:  MainApp
          },
          {
              path: 'roleaccess',
              name: 'RoleAccess',
              component: RoleAccess
          }
      ]
    }
  ]
})


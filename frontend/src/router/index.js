/**
 * Vue Router configuration
 * @module router
 */

import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

// Views
import Login from '@/views/Login'
import Dashboard from '@/views/Dashboard'
import ChatDetail from '@/components/chats/ChatDetail'

/**
 * Application routes configuration
 * @type {Array<Object>}
 */
const routes = [
  {
    path: '/',
    redirect: '/tasks'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/tasks',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/lists/:listId',
    name: 'TaskList',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/chats',
    name: 'Chats',
    component: Dashboard,
    meta: { requiresAuth: true }
  }
]

/**
 * Vue Router instance
 * @type {Router}
 */
const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * Navigation guard to handle authentication
 */
router.beforeEach((to, from, next) => {
  // TODO: Re-enable authentication when ready
  next()
  
  // Previous implementation:
  // const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  // const isAuthenticated = store.getters['auth/isAuthenticated']
  // if (requiresAuth && !isAuthenticated) {
  //   next('/login')
  // } else if (to.path === '/login' && isAuthenticated) {
  //   next('/tasks')
  // } else {
  //   next()
  // }
})

export default router
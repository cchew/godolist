/**
 * Main application entry point
 * @module main
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { vuetify } from './plugins/vuetify'
import './style.css'
import { initializeFirebase } from './services/firebase'

// Initialize Firebase
initializeFirebase()

// Create and mount the Vue application
createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app')
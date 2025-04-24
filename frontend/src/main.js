import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { vuetify } from './plugins/vuetify'
import './style.css'
import { initializeFirebase } from './services/firebase'

// Initialize Firebase
initializeFirebase()

createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app')
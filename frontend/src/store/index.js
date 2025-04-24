import { createStore } from 'vuex'
import auth from './modules/auth'
import tasks from './modules/tasks'
import lists from './modules/lists'
import chats from './modules/chats'

export default createStore({
  modules: {
    auth,
    tasks,
    lists,
    chats
  }
})
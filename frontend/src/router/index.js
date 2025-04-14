import { createRouter, createWebHistory } from 'vue-router';
import TaskList from '../components/TaskList.vue';
import store from '../store';

const routes = [
  {
    path: '/',
    redirect: '/tasks/my-day'
  },
  {
    path: '/tasks/unassigned',
    name: 'UnassignedTasks',
    component: TaskList
  },
  {
    path: '/tasks/:folderId',
    name: 'TasksList',
    component: TaskList,
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  // Update the current folder in the store based on the route
  if (to.params.folderId) {
    store.dispatch('setCurrentFolder', to.params.folderId === 'my-day' ? 'my-day' : Number(to.params.folderId));
  } else if (to.name === 'UnassignedTasks') {
    store.dispatch('setCurrentFolder', 'unassigned');
  }
  next();
});

export default router;
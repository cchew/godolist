<template>
  <div class="app-container">
    <SideBar @folder-select="navigateToFolder" />
    <div class="main-panels">
      <router-view></router-view>
      <TaskDetails v-if="selectedTask" />
    </div>
  </div>
</template>

<script>
import SideBar from './components/SideBar.vue';
import TaskDetails from './components/TaskDetails.vue';
import { mapState } from 'vuex';

export default {
  name: 'App',
  components: {
    SideBar,
    TaskDetails
  },
  computed: {
    ...mapState(['selectedTask'])
  },
  methods: {
    navigateToFolder(folderId) {
      if (folderId === 'unassigned') {
        this.$router.push('/tasks/unassigned');
      } else {
        this.$router.push(`/tasks/${folderId}`);
      }
    }
  },
  mounted() {
    this.$store.dispatch('fetchFolders');
    this.$store.dispatch('fetchTasks');
  }
}
</script>

<style>
@import '@mdi/font/css/materialdesignicons.css';

.app-container {
  display: flex;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #faf9f8;
  color: #323130;
}

.main-panels {
  display: flex;
  flex: 1;
  overflow: hidden;
}

input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 14px;
  color: #323130;
}

input::placeholder {
  color: #605e5c;
}

.checkbox-container {
  display: inline-block;
  position: relative;
  padding-left: 25px;
  margin-right: 12px;
  cursor: pointer;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  border: 2px solid #605e5c;
  border-radius: 50%;
}

.checkbox-container:hover .checkmark {
  border-color: #2564cf;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #2564cf;
  border-color: #2564cf;
}
</style>

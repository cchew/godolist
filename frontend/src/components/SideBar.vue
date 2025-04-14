<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="app-title">Go Do List</h1>
    </div>
    <div class="folder-list">
      <div 
        class="folder-item" 
        :class="{ active: currentFolder === 'unassigned' }"
        @click="$emit('folder-select', 'unassigned')"
      >
        <i class="mdi mdi-inbox"></i>
        <span>Unassigned Tasks</span>
        <span class="task-count" v-if="unassignedTasks.length">
          {{ unassignedTasks.length }}
        </span>
      </div>
      <div v-for="folder in folders" 
        :key="folder.id" 
        class="folder-item"
        :class="{ active: currentFolder === folder.id }"
        @click="$emit('folder-select', folder.id)"
      >
        <i class="mdi mdi-folder"></i>
        <span>{{ folder.name }}</span>
        <span class="task-count" v-if="getTaskCountForFolder(folder.id)">
          {{ getTaskCountForFolder(folder.id) }}
        </span>
      </div>
    </div>
    <div class="new-folder">
      <i class="mdi mdi-plus"></i>
      <input 
        v-model="newFolderName" 
        placeholder="New List" 
        @keyup.enter="addFolder"
      />
    </div>
  </aside>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'SideBar',
  data() {
    return {
      newFolderName: ''
    }
  },
  computed: {
    ...mapState(['folders', 'currentFolder']),
    ...mapGetters(['tasksByFolder', 'unassignedTasks'])
  },
  methods: {
    addFolder() {
      if (this.newFolderName.trim()) {
        this.$store.dispatch('createFolder', this.newFolderName);
        this.newFolderName = '';
      }
    },
    getTaskCountForFolder(folderId) {
      return this.tasksByFolder(folderId).length;
    }
  },
  emits: ['folder-select']
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  background-color: #fff;
  border-right: 1px solid #edebe9;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid #edebe9;
}

.app-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #2564cf;
}

.folder-list {
  flex: 1;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  color: #323130;
}

.folder-item:hover {
  background-color: #f3f2f1;
}

.folder-item.active {
  background-color: #f0f8ff;
  color: #2564cf;
}

.folder-item i {
  margin-right: 10px;
}

.new-folder {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  border-top: 1px solid #edebe9;
}

.new-folder i {
  margin-right: 10px;
  color: #2564cf;
}

.task-count {
  margin-left: auto;
  background: #f3f2f1;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #605e5c;
}

.folder-item .task-count {
  opacity: 0.8;
}

.folder-item:hover .task-count {
  opacity: 1;
}
</style>
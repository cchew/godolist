<template>
  <div class="app-container">
    <AppNavigation />
    
    <v-main>
      <v-container fluid class="main-container pa-0">
        <div class="d-flex flex-column h-100">
          <!-- Header -->
          <AppHeader 
            :title="currentListTitle" 
            @search="handleSearch"
          />
          
          <div class="task-container">
            <!-- Task List or Chat List -->
            <div class="task-list-container" v-if="!chatMode">
              <TaskList 
                v-if="!isChatsRoute"
                :tasks="filteredTasks"
                :loading="tasksLoading"
                @select-task="selectTask"
                @go-do="startChatMode"
              />
              <ChatList
                v-else
                :loading="false"
                @select-chat="selectChat"
              />
            </div>
            <div v-else class="chat-container">
              <div class="d-flex align-center px-4 py-2 chat-header">
                <v-btn
                  icon="mdi-arrow-left"
                  variant="text"
                  size="small"
                  @click="exitChatMode"
                  class="mr-2"
                />
                <div class="text-subtitle-1 font-weight-medium">{{ chatTask.title }}</div>
              </div>
              <ChatInterface 
                :task="chatTask"
                :messages="selectedChat ? selectedChat.messages : []"
              />
            </div>
            
            <!-- Task Detail -->
            <transition name="slide">
              <div v-if="selectedTask && !chatMode && !isChatsRoute" class="task-detail-container">
                <TaskDetail
                  :task="selectedTask"
                  @update="updateTask"
                  @close="closeTaskDetail"
                />
              </div>
            </transition>
          </div>
        </div>
      </v-container>
    </v-main>
    
    <!-- Add Task FAB -->
    <v-btn
      v-if="!chatMode && !isChatsRoute"
      color="primary"
      size="large"
      icon
      class="add-task-btn"
      @click="openAddTaskDialog"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    
    <!-- Add/Edit Task Dialog -->
    <TaskFormDialog
      v-model="showTaskDialog"
      :task="editingTask"
      :list-id="currentListId"
      @save="saveTask"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AppNavigation from '@/components/navigation/AppNavigation'
import AppHeader from '@/components/AppHeader'
import TaskList from '@/components/tasks/TaskList'
import TaskDetail from '@/components/tasks/TaskDetail'
import TaskFormDialog from '@/components/tasks/TaskFormDialog'
import ChatList from '@/components/chats/ChatList'
import ChatInterface from '@/components/chats/ChatInterface'

export default {
  name: 'Dashboard',
  components: {
    AppNavigation,
    AppHeader,
    TaskList,
    TaskDetail,
    TaskFormDialog,
    ChatList,
    ChatInterface
  },
  data() {
    return {
      showTaskDialog: false,
      editingTask: null,
      searchResults: null,
      chatMode: false,
      chatTask: null,
      selectedChat: null
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser']),
    ...mapGetters('tasks', ['tasksByList', 'isLoading', 'selectedTask']),
    ...mapGetters('lists', ['getListById']),
    ...mapGetters('chats', ['allChats']),
    
    tasksLoading() {
      return this.isLoading
    },
    
    isChatsRoute() {
      return this.$route.path === '/chats'
    },
    
    currentListId() {
      return this.$route.params.listId || 'all'
    },
    
    currentListTitle() {
      if (this.chatMode) {
        return this.chatTask.title
      }
      if (this.isChatsRoute) {
        return 'All Chats'
      }
      if (this.currentListId === 'all') {
        return 'All Tasks'
      } else if (this.currentListId === 'important') {
        return 'Important Tasks'
      } else if (this.currentListId === 'completed') {
        return 'Completed Tasks'
      } else {
        const list = this.getListById(this.currentListId)
        return list ? list.name : 'Tasks'
      }
    },
    
    filteredTasks() {
      console.log('Filtering tasks for listId:', this.currentListId)
      const tasks = this.tasksByList(this.currentListId)
      console.log('Filtered tasks:', tasks)
      return this.searchResults || tasks
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        this.clearSearch()
        this.exitChatMode()
        this.selectedChat = null
        
        // Fetch tasks for the current folder
        if (this.currentUser) {
          const folderId = to.params.listId
          if (folderId && folderId !== 'all' && folderId !== 'important' && folderId !== 'completed') {
            this.fetchTasks(folderId)
          } else {
            this.fetchTasks()
          }
        }
      }
    }
  },
  created() {
    if (this.currentUser) {
      this.fetchLists()
      // Initial task fetch will be handled by the route watcher
    }
  },
  methods: {
    ...mapActions('tasks', ['fetchTasks', 'addTask', 'updateTask', 'setSelectedTask']),
    ...mapActions('lists', ['fetchLists']),
    
    selectTask(task) {
      this.setSelectedTask(task)
    },
    
    selectChat(chat) {
      this.selectedChat = chat
      this.chatMode = true
      this.chatTask = {
        title: chat.name
      }
    },
    
    closeTaskDetail() {
      this.setSelectedTask(null)
    },
    
    openAddTaskDialog() {
      this.editingTask = null
      this.showTaskDialog = true
    },
    
    saveTask(task) {
      if (task.id) {
        this.updateTask({
          id: task.id,
          updates: task
        })
      } else {
        this.addTask({
          ...task,
          folder_id: this.currentListId === 'all' ? null : this.currentListId
        })
      }
      this.showTaskDialog = false
    },
    
    handleSearch(results) {
      this.searchResults = results
    },
    
    clearSearch() {
      this.searchResults = null
    },
    
    startChatMode(task) {
      this.chatTask = task
      this.chatMode = true
      this.closeTaskDetail()
    },
    
    exitChatMode() {
      this.chatMode = false
      this.chatTask = null
    }
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
}

.main-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.task-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.task-list-container {
  flex: 1;
  overflow-y: auto;
  border-right: none;
  background-color: var(--v-background-base);
}

.task-detail-container {
  width: 340px;
  overflow-y: auto;
  background-color: var(--v-background-base);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--v-divider-base);
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  background-color: var(--v-background-base);
}

.empty-state .v-icon {
  color: var(--v-textMuted-base) !important;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  color: var(--v-secondary-darken-1) !important;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.875rem !important;
  color: var(--v-textMuted-base) !important;
}

.add-task-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .task-container {
    flex-direction: column;
  }
  
  .task-list-container,
  .task-detail-container {
    flex: none;
    width: 100%;
  }
  
  .task-list-container {
    height: 60%;
  }
  
  .task-detail-container {
    height: 40%;
    border-left: none;
    border-top: 1px solid var(--v-divider-base);
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--v-background-base);
  overflow: hidden;
}

.chat-header {
  border-bottom: 1px solid var(--v-divider-base);
  background-color: var(--v-surface-base);
}

.chat-header .text-subtitle-1 {
  font-size: 0.875rem !important;
  color: var(--v-secondary-darken-1);
}
</style>
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
                @agent-task-response="handleAgentResponse"
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

/**
 * Dashboard component provides the main application interface
 * @component
 */
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
    
    /**
     * Whether tasks are currently loading
     * @returns {boolean} True if tasks are loading
     */
    tasksLoading() {
      return this.isLoading
    },
    
    /**
     * Whether current route is chats
     * @returns {boolean} True if on chats route
     */
    isChatsRoute() {
      return this.$route.path === '/chats'
    },
    
    /**
     * Current list ID from route
     * @returns {string} List ID
     */
    currentListId() {
      return this.$route.params.listId || 'all'
    },
    
    /**
     * Current list title for display
     * @returns {string} List title
     */
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
    
    /**
     * Filtered tasks based on current list and search
     * @returns {Array} Filtered tasks
     */
    filteredTasks() {
      const tasks = this.tasksByList(this.currentListId)
      return this.searchResults || tasks
    }
  },
  
  watch: {
    /**
     * Watches route changes to update tasks and state
     */
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
  
  /**
   * Lifecycle hook that initializes data
   */
  created() {
    if (this.currentUser) {
      this.fetchLists()
      // Initial task fetch will be handled by the route watcher
    }
  },
  
  methods: {
    ...mapActions('tasks', ['fetchTasks', 'addTask', 'updateTask', 'setSelectedTask']),
    ...mapActions('lists', ['fetchLists']),
    
    /**
     * Selects a task for detail view
     * @param {Object} task - Task to select
     */
    selectTask(task) {
      this.setSelectedTask(task)
    },
    
    /**
     * Selects a chat for chat mode
     * @param {Object} chat - Chat to select
     */
    selectChat(chat) {
      this.selectedChat = chat
      this.chatMode = true
      this.chatTask = {
        title: chat.name
      }
    },
    
    /**
     * Handles search results
     * @param {Array} results - Search results
     */
    handleSearch(results) {
      this.searchResults = results
    },
    
    /**
     * Clears search results
     */
    clearSearch() {
      this.searchResults = null
    },
    
    /**
     * Opens add task dialog
     */
    openAddTaskDialog() {
      this.editingTask = null
      this.showTaskDialog = true
    },
    
    /**
     * Saves task changes
     * @param {Object} task - Task to save
     */
    async saveTask(task) {
      try {
        if (task.id) {
          await this.updateTask({
            id: task.id,
            updates: task
          })
        } else {
          await this.addTask(task)
        }
        this.showTaskDialog = false
      } catch (error) {
        console.error('Error saving task:', error)
      }
    },
    
    /**
     * Handles agent task response and starts chat mode
     * @param {Object} response - Response from the agent
     */
    handleAgentResponse(response) {
      // Start chat mode with the task from the response
      this.chatMode = true;
      this.chatTask = response.task; // The task object from the backend
      
      // Initialize chat with agent response
      this.selectedChat = {
        name: response.task.title,
        messages: [{
          role: 'assistant',
          content: response.content
        }]
      };
    },
    
    /**
     * Starts chat mode for a task
     * @param {Object} task - Task to chat about
     */
    startChatMode(task) {
      this.chatMode = true;
      this.chatTask = task;
      // Keep existing behavior for regular chat mode
      this.selectedChat = {
        name: task.title,
        messages: []
      };
    },
    
    /**
     * Exits chat mode
     */
    exitChatMode() {
      this.chatMode = false
      this.chatTask = null
      this.selectedChat = null
    },
    
    /**
     * Closes task detail view
     */
    closeTaskDetail() {
      this.setSelectedTask(null)
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
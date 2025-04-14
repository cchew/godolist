<template>
  <main class="main-content">
    <div class="tasks-header">
      <h2>{{ currentFolderName }}</h2>
      <div class="date">{{ currentDate }}</div>
    </div>

    <div class="add-task">
      <i class="mdi mdi-plus-circle-outline"></i>
      <input 
        v-model="newTaskTitle" 
        placeholder="Add a task" 
        @keyup.enter="addTask"
      />
    </div>

    <div class="tasks-list">
      <template v-if="$route.name === 'UnassignedTasks'">
        <div 
          v-for="task in unassignedTasks" 
          :key="task.id" 
          class="task-item"
          :class="{ 'task-completed': task.completed }"
          @click="selectTask(task)"
        >
          <TaskItem 
            :task="task" 
            @toggle="toggleTask" 
            @toggle-importance="toggleImportance"
            @go-do="handleGoDo"
            @delete="deleteTask"
          />
        </div>
      </template>
      <template v-else>
        <div 
          v-for="task in currentFolderTasks" 
          :key="task.id" 
          class="task-item"
          :class="{ 'task-completed': task.completed }"
          @click="selectTask(task)"
        >
          <TaskItem 
            :task="task" 
            @toggle="toggleTask" 
            @toggle-importance="toggleImportance"
            @go-do="handleGoDo"
            @delete="deleteTask"
          />
        </div>
      </template>
    </div>

    <!-- Agent Results Modal -->
    <div v-if="showAgentResults" class="modal-overlay" @click.self="closeAgentResults">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Agent Results</h3>
          <button class="close-button" @click="closeAgentResults">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="isProcessing" class="processing">
            <i class="mdi mdi-loading mdi-spin"></i>
            <p>Processing task...</p>
          </div>
          <div v-else-if="agentError" class="error">
            <i class="mdi mdi-alert-circle"></i>
            <p>{{ agentError }}</p>
          </div>
          <div v-else class="results">
            <div class="task-info">
              <h4>{{ currentTask?.title }}</h4>
            </div>
            <div class="agent-response" v-html="agentResponse"></div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import TaskItem from './TaskItem.vue';

export default {
  name: 'TaskList',
  components: {
    TaskItem
  },
  props: {
    folderId: {
      type: [String, Number],
      default: 'my-day'
    }
  },
  data() {
    return {
      newTaskTitle: '',
      showAgentResults: false,
      isProcessing: false,
      agentResponse: '',
      agentError: null,
      currentTask: null
    };
  },
  computed: {
    ...mapState(['currentFolder']),
    ...mapGetters(['tasksByFolder', 'unassignedTasks']),
    currentFolderTasks() {
      return this.tasksByFolder(this.folderId);
    },
    currentFolderName() {
      if (this.folderId === 'my-day') return 'My Day';
      if (this.folderId === 'important') return 'Important';
      const folder = this.$store.state.folders.find(f => f.id === this.folderId);
      return folder ? folder.name : 'Tasks';
    },
    currentDate() {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  },
  methods: {
    async addTask() {
      if (this.newTaskTitle.trim()) {
        const task = {
          title: this.newTaskTitle.trim(),
          folder_id: this.folderId === 'my-day' ? null : this.folderId
        };
        await this.$store.dispatch('createTask', task);
        this.newTaskTitle = '';
      }
    },
    async toggleTask(task) {
      await this.$store.dispatch('toggleTaskCompletion', task);
    },
    async toggleImportance(taskId) {
      await this.$store.dispatch('toggleTaskImportance', taskId);
    },
    async deleteTask(taskId) {
      if (confirm('Are you sure you want to delete this task?')) {
        await this.$store.dispatch('deleteTask', taskId);
      }
    },
    selectTask(task) {
      this.$store.commit('setSelectedTask', task);
    },
    async handleGoDo(task) {
      this.currentTask = task;
      this.showAgentResults = true;
      this.isProcessing = true;
      this.agentError = null;
      
      try {
        const response = await this.$store.dispatch('processTaskWithAgent', task);
        this.agentResponse = response.response;
      } catch (error) {
        this.agentError = error.message || 'An error occurred while processing the task';
      } finally {
        this.isProcessing = false;
      }
    },
    closeAgentResults() {
      this.showAgentResults = false;
      this.agentResponse = '';
      this.agentError = null;
    }
  }
};
</script>

<style scoped>
.main-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.tasks-header {
  margin-bottom: 30px;
}

.tasks-header h2 {
  font-size: 1.8rem;
  margin: 0 0 10px;
  color: #323130;
}

.date {
  color: #605e5c;
}

.add-task {
  display: flex;
  align-items: center;
  background: white;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.add-task i {
  color: #2564cf;
  margin-right: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  margin-bottom: 2px;
  border-radius: 4px;
  transition: transform 0.2s, opacity 0.2s;
}

.task-item:hover {
  background-color: #f8f8f8;
}

.task-item.task-completed {
  animation: completeTask 0.3s ease-out;
}

@keyframes completeTask {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #e1e1e1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #323130;
}

.close-button {
  background: none;
  border: none;
  color: #605e5c;
  cursor: pointer;
  padding: 4px;
}

.close-button:hover {
  color: #2564cf;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #605e5c;
}

.processing i {
  font-size: 2rem;
  margin-bottom: 16px;
  color: #2564cf;
}

.error {
  display: flex;
  align-items: center;
  color: #d13438;
  padding: 16px;
}

.error i {
  margin-right: 8px;
}

.task-info {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e1e1e1;
}

.task-info h4 {
  margin: 0;
  color: #323130;
}

.agent-response {
  color: #323130;
  line-height: 1.5;
}

.agent-response :deep(p) {
  margin-bottom: 16px;
}

.agent-response :deep(ul), 
.agent-response :deep(ol) {
  margin-bottom: 16px;
  padding-left: 16px;
}

.agent-response :deep(li) {
  margin-bottom: 8px;
}
</style>
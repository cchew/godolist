import { createStore } from 'vuex';
import axios from 'axios';

const store = createStore({
  state: {
    folders: [],
    tasks: [],
    currentFolder: 'my-day',
    selectedTask: null,
    taskFiles: {}, // Map of taskId -> files array
    agentConfig: {
      openai_api_key: null,
      qdrant_url: null,
      qdrant_api_key: null
    }
  },
  getters: {
    tasksByFolder: (state) => (folderId) => {
      // Convert folderId to number if it's a string and not 'my-day'
      const numericFolderId = folderId === 'my-day' ? null : Number(folderId);
      return state.tasks.filter(task => task.folder_id === numericFolderId);
    },
    unassignedTasks: (state) => {
      return state.tasks.filter(task => task.folder_id === null);
    }
  },
  mutations: {
    setFolders(state, folders) {
      state.folders = folders;
    },
    setTasks(state, tasks) {
      state.tasks = tasks;
    },
    addFolder(state, folder) {
      state.folders.push(folder);
    },
    addTask(state, task) {
      state.tasks.push(task);
    },
    updateTask(state, updatedTask) {
      const index = state.tasks.findIndex(task => task.id === updatedTask.id);
      if (index !== -1) {
        state.tasks.splice(index, 1, updatedTask);
      }
    },
    deleteTask(state, taskId) {
      state.tasks = state.tasks.filter(task => task.id !== taskId);
      // Also remove any associated files
      if (state.taskFiles[taskId]) {
        delete state.taskFiles[taskId];
      }
    },
    setCurrentFolder(state, folderId) {
      state.currentFolder = folderId;
    },
    setSelectedTask(state, task) {
      state.selectedTask = task;
    },
    updateTaskImportance(state, { taskId, isImportant }) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.isImportant = isImportant;
      }
    },
    setTaskFiles(state, { taskId, files }) {
      state.taskFiles = {
        ...state.taskFiles,
        [taskId]: files
      };
    },
    addTaskFile(state, { taskId, file }) {
      const taskFiles = state.taskFiles[taskId] || [];
      state.taskFiles[taskId] = [...taskFiles, file];
    },
    setAgentConfig(state, config) {
      state.agentConfig = {
        ...state.agentConfig,
        ...config
      };
    }
  },
  actions: {
    async fetchFolders({ commit }) {
      const response = await axios.get('http://127.0.0.1:5000/folders');
      commit('setFolders', response.data);
    },
    async fetchTasks({ commit }) {
      const response = await axios.get('http://127.0.0.1:5000/tasks');
      commit('setTasks', response.data);
    },
    async createFolder({ commit }, folderName) {
      const response = await axios.post('http://127.0.0.1:5000/folders', { name: folderName });
      commit('addFolder', response.data);
    },
    async createTask({ commit }, task) {
      const response = await axios.post('http://127.0.0.1:5000/tasks', task);
      commit('addTask', response.data);
    },
    async toggleTaskCompletion({ commit }, task) {
      const updatedTask = { ...task, completed: !task.completed };
      const response = await axios.patch(`http://127.0.0.1:5000/tasks?id=${task.id}`, { completed: !task.completed });
      commit('updateTask', response.data);
    },
    async updateTaskTitle({ commit }, task) {
      const response = await axios.patch(`http://127.0.0.1:5000/tasks?id=${task.id}`, { title: task.title });
      commit('updateTask', response.data);
    },
    async updateTaskNotes({ commit }, task) {
      const response = await axios.patch(`http://127.0.0.1:5000/tasks?id=${task.id}`, { notes: task.notes });
      commit('updateTask', response.data);
    },
    async updateTaskFolder({ commit }, task) {
      const response = await axios.patch(`http://127.0.0.1:5000/tasks?id=${task.id}`, { folder_id: task.folder_id });
      commit('updateTask', response.data);
    },
    async toggleTaskImportance({ commit, state }, taskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        const isImportant = !task.isImportant;
        const response = await axios.patch(`http://127.0.0.1:5000/tasks?id=${taskId}`, { is_important: isImportant });
        commit('updateTask', response.data);
      }
    },
    setCurrentFolder({ commit }, folderId) {
      commit('setCurrentFolder', folderId);
    },
    selectTask({ commit }, task) {
      commit('setSelectedTask', task);
    },
    async uploadTaskFile({ commit }, { taskId, file }) {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `http://127.0.0.1:5000/tasks/${taskId}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      commit('addTaskFile', { taskId, file: response.data });
      return response.data;
    },
    
    async fetchTaskFiles({ commit }, taskId) {
      const response = await axios.get(`http://127.0.0.1:5000/tasks/${taskId}/files`);
      commit('setTaskFiles', { taskId, files: response.data });
      return response.data;
    },
    
    async downloadFile(_, fileId) {
      const response = await axios.get(
        `http://127.0.0.1:5000/files/${fileId}`,
        { responseType: 'blob' }
      );
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.headers['content-disposition'].split('filename=')[1]);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    },

    async processTaskWithAgent({ state }, task) {
      // First, fetch any associated files for the task
      const files = await axios.get(`http://127.0.0.1:5000/tasks/${task.id}/files`);
      
      // Determine task type based on title
      const taskType = getTaskType(task.title);
      
      // Prepare the request payload
      const payload = {
        task_id: task.id,
        task_title: task.title,
        task_type: taskType,
        files: files.data,
        agent_config: state.agentConfig
      };

      // Send the request to the backend
      const response = await axios.post(
        'http://127.0.0.1:5000/process-task',
        payload
      );

      return response.data;
    },

    async deleteTask({ commit }, taskId) {
      await axios.delete(`http://127.0.0.1:5000/tasks?id=${taskId}`);
      commit('deleteTask', taskId);
    }
  }
});

// Helper function to determine task type
function getTaskType(title) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('review')) return 'review';
  if (titleLower.includes('analyze')) return 'analyze';
  if (titleLower.includes('summarize')) return 'summarize';
  return 'review'; // Default to review if no specific type is found
}

export default store;
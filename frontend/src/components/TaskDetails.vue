<template>
  <aside class="task-details">
    <div class="task-details-header">
      <h3>Task Details</h3>
      <button class="close-button" @click="close">
        <i class="mdi mdi-close"></i>
      </button>
    </div>
    <div class="task-details-content">
      <div class="task-details-section">
        <i class="mdi mdi-folder"></i>
        <select v-model="selectedTask.folder_id" @change="updateTaskFolder">
          <option :value="null">No List</option>
          <option v-for="folder in folders" :key="folder.id" :value="folder.id">
            {{ folder.name }}
          </option>
        </select>
      </div>
      <div class="task-notes">
        <textarea 
          v-model="selectedTask.notes"
          placeholder="Add note"
          rows="4"
          @change="updateTaskNotes"
        ></textarea>
      </div>
      
      <!-- File Upload Section -->
      <div class="task-files">
        <div class="file-upload">
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileUpload"
            style="display: none"
            accept=".pdf"
          />
          <button 
            class="upload-button" 
            @click="$refs.fileInput.click()"
            :disabled="isUploading"
          >
            <i class="mdi" :class="isUploading ? 'mdi-loading mdi-spin' : 'mdi-upload'"></i>
            {{ isUploading ? 'Uploading...' : 'Upload PDF' }}
          </button>
        </div>
        
        <!-- Error Message -->
        <div v-if="uploadError" class="error-message">
          <i class="mdi mdi-alert"></i>
          {{ uploadError }}
        </div>
        
        <!-- File List -->
        <div v-if="taskFiles.length > 0" class="files-list">
          <div v-for="file in taskFiles" :key="file.id" class="file-item">
            <i class="mdi mdi-file-document-outline"></i>
            <span class="file-name">{{ file.filename }}</span>
            <button 
              class="download-button" 
              @click="downloadFile(file.id)"
              :disabled="isDownloading[file.id]"
            >
              <i class="mdi" :class="isDownloading[file.id] ? 'mdi-loading mdi-spin' : 'mdi-download'"></i>
            </button>
          </div>
        </div>
        <div v-else-if="!isLoading" class="no-files">
          No files attached
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'TaskDetails',
  data() {
    return {
      isUploading: false,
      isDownloading: {},
      uploadError: null,
      isLoading: false
    }
  },
  computed: {
    ...mapState(['folders', 'selectedTask', 'taskFiles']),
    taskFiles() {
      return this.$store.state.taskFiles[this.selectedTask?.id] || [];
    }
  },
  methods: {
    close() {
      this.$store.commit('setSelectedTask', null);
    },
    toggleTask(task) {
      this.$store.dispatch('toggleTaskCompletion', task);
    },
    toggleImportance(taskId) {
      this.$store.dispatch('toggleTaskImportance', taskId);
    },
    updateTaskTitle() {
      if (this.selectedTask) {
        this.$store.dispatch('updateTaskTitle', this.selectedTask);
      }
    },
    updateTaskNotes() {
      if (this.selectedTask) {
        this.$store.dispatch('updateTaskNotes', this.selectedTask);
      }
    },
    updateTaskFolder() {
      if (this.selectedTask) {
        this.$store.dispatch('updateTaskFolder', this.selectedTask);
      }
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && this.selectedTask) {
        try {
          this.isUploading = true;
          this.uploadError = null;
          
          await this.$store.dispatch('uploadTaskFile', {
            taskId: this.selectedTask.id,
            file
          });
          
          // Clear the input
          this.$refs.fileInput.value = '';
        } catch (error) {
          this.uploadError = error.response?.data?.error || 'Error uploading file';
          console.error('Error uploading file:', error);
        } finally {
          this.isUploading = false;
        }
      }
    },
    async downloadFile(fileId) {
      try {
        this.$set(this.isDownloading, fileId, true);
        await this.$store.dispatch('downloadFile', fileId);
      } catch (error) {
        console.error('Error downloading file:', error);
      } finally {
        this.$set(this.isDownloading, fileId, false);
      }
    }
  },
  watch: {
    'selectedTask.id': {
      immediate: true,
      async handler(taskId) {
        if (taskId) {
          try {
            this.isLoading = true;
            await this.$store.dispatch('fetchTaskFiles', taskId);
          } catch (error) {
            console.error('Error fetching files:', error);
          } finally {
            this.isLoading = false;
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.task-details {
  width: 400px;
  background-color: white;
  border-left: 1px solid #edebe9;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-details-header {
  padding: 16px;
  border-bottom: 1px solid #edebe9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-details-header h3 {
  margin: 0;
  font-size: 1.2rem;
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

.task-details-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.task-details-section {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.task-details-section i {
  margin-right: 8px;
  color: #605e5c;
}

.task-details-section select {
  flex: 1;
  padding: 8px;
  border: 1px solid #edebe9;
  border-radius: 4px;
  background-color: white;
  color: #323130;
}

.task-notes {
  margin-bottom: 16px;
}

.task-notes textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #edebe9;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
}

.task-files {
  margin-top: 16px;
}

.file-upload {
  margin-bottom: 16px;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #2564cf;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.upload-button:hover {
  background-color: #225abc;
}

.upload-button:disabled {
  background-color: #a19f9d;
  cursor: not-allowed;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #323130;
}

.download-button {
  background: none;
  border: none;
  color: #605e5c;
  cursor: pointer;
  padding: 4px;
}

.download-button:hover {
  color: #2564cf;
}

.download-button:disabled {
  color: #a19f9d;
  cursor: not-allowed;
}

.error-message {
  color: #d13438;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  padding: 8px;
  background-color: #fde7e9;
  border-radius: 4px;
  font-size: 14px;
}

.no-files {
  color: #605e5c;
  text-align: center;
  padding: 16px;
  font-size: 14px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mdi-spin {
  animation: spin 1s linear infinite;
}
</style>
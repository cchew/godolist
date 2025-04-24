<template>
  <div class="task-detail pa-4">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h2 class="text-h6 font-weight-medium">Task Details</h2>
      </div>
      <v-btn
        icon="mdi-close"
        variant="text"
        density="comfortable"
        @click="closeDetail"
      />
    </div>
    
    <div class="task-status d-flex align-center mb-6">
      <v-checkbox
        v-model="completed"
        color="primary"
        hide-details
        @change="updateTaskStatus"
        class="mr-4"
      />
      <div class="task-title-container">
        <v-text-field
          v-model="title"
          variant="plain"
          density="comfortable"
          hide-details
          class="task-title-field"
          @change="updateTitle"
        />
      </div>
    </div>
    
    <v-card variant="outlined" class="mb-4">
      <v-card-text>
        <div class="d-flex flex-column">
          <div class="d-flex align-center mb-4">
            <v-icon color="primary" class="mr-3">mdi-information-outline</v-icon>
            <div class="w-100">
              <div class="text-subtitle-2 font-weight-medium mb-1">Description</div>
              <v-textarea
                v-model="description"
                variant="outlined"
                density="comfortable"
                auto-grow
                rows="3"
                placeholder="Add a description"
                hide-details
                @change="updateDescription"
              />
            </div>
          </div>
          
          <div class="d-flex align-center mb-4">
            <v-icon color="primary" class="mr-3">mdi-calendar</v-icon>
            <div class="w-100">
              <div class="text-subtitle-2 font-weight-medium mb-1">Due Date</div>
              <v-menu
                v-model="dateMenu"
                :close-on-content-click="false"
                location="bottom"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    :model-value="formattedDate"
                    readonly
                    v-bind="props"
                    prepend-icon="mdi-calendar"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Add due date"
                    hide-details
                    class="date-picker"
                  />
                </template>
                <v-date-picker
                  v-model="dueDate"
                  @update:model-value="updateDueDate"
                />
              </v-menu>
            </div>
          </div>
          
          <div class="d-flex align-center mb-4">
            <v-icon color="primary" class="mr-3">mdi-star</v-icon>
            <div class="w-100">
              <div class="text-subtitle-2 font-weight-medium mb-1">Priority</div>
              <v-switch
                v-model="important"
                color="warning"
                hide-details
                :label="important ? 'Important' : 'Regular'"
                @change="updateImportance"
              />
            </div>
          </div>
          
          <div class="d-flex align-center">
            <v-icon color="primary" class="mr-3">mdi-tag</v-icon>
            <div class="w-100">
              <div class="text-subtitle-2 font-weight-medium mb-1">List</div>
              <v-select
                v-model="taskList"
                :items="lists"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="updateTaskList"
              >
                <template v-slot:selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :icon="item.raw.icon" size="small" class="mr-2" />
                    {{ item.title }}
                  </div>
                </template>
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :icon="item.raw.icon" size="small" />
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <div class="mt-auto">
      <div class="text-caption text-medium-emphasis mb-1">
        Created: {{ formattedCreatedDate }}
      </div>
      <div class="d-flex justify-space-between">
        <v-btn
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
          @click="confirmDelete"
        >
          Delete
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { format } from 'date-fns'

/**
 * TaskDetail component displays and allows editing of a task's details
 * @component
 */
export default {
  name: 'TaskDetail',
  
  props: {
    /**
     * The task object to display and edit
     * @type {Object}
     * @required
     */
    task: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      completed: this.task.completed,
      title: this.task.title,
      description: this.task.description || '',
      dueDate: this.task.dueDate || null,
      important: this.task.important,
      taskList: this.task.folder_id,
      dateMenu: false
    }
  },
  
  computed: {
    ...mapGetters('lists', ['allLists']),
    
    /**
     * List of available task lists
     * @returns {Array} Array of list objects
     */
    lists() {
      return this.allLists
    },
    
    /**
     * Formatted due date string
     * @returns {string} Formatted date string
     */
    formattedDate() {
      if (!this.dueDate) return ''
      return format(new Date(this.dueDate), 'MMM d, yyyy')
    },
    
    /**
     * Formatted creation date string
     * @returns {string} Formatted date string
     */
    formattedCreatedDate() {
      if (!this.task.createdAt) return ''
      return format(new Date(this.task.createdAt), 'MMM d, yyyy')
    }
  },
  
  methods: {
    ...mapActions('tasks', ['updateTask', 'deleteTask']),
    
    /**
     * Emits close event to parent
     */
    closeDetail() {
      this.$emit('close')
    },
    
    /**
     * Updates task completion status
     */
    updateTaskStatus() {
      this.updateTask({
        id: this.task.id,
        updates: { completed: this.completed }
      })
    },
    
    /**
     * Updates task title
     */
    updateTitle() {
      if (!this.title.trim()) {
        this.title = this.task.title
        return
      }
      this.updateTask({
        id: this.task.id,
        updates: { title: this.title.trim() }
      })
    },
    
    /**
     * Updates task description
     */
    updateDescription() {
      this.updateTask({
        id: this.task.id,
        updates: { description: this.description }
      })
    },
    
    /**
     * Updates task due date
     */
    updateDueDate() {
      this.dateMenu = false
      this.updateTask({
        id: this.task.id,
        updates: { dueDate: this.dueDate }
      })
    },
    
    /**
     * Updates task importance
     */
    updateImportance() {
      this.updateTask({
        id: this.task.id,
        updates: { important: this.important }
      })
    },
    
    /**
     * Updates task list
     */
    updateTaskList() {
      this.updateTask({
        id: this.task.id,
        updates: { folder_id: this.taskList }
      })
    },
    
    /**
     * Confirms and deletes the task
     */
    confirmDelete() {
      if (confirm(`Delete task "${this.title}"?`)) {
        this.deleteTask(this.task.id)
        this.closeDetail()
      }
    }
  },
  watch: {
    task: {
      handler(newTask) {
        this.completed = newTask.completed
        this.title = newTask.title
        this.description = newTask.description || ''
        this.dueDate = newTask.dueDate || null
        this.important = newTask.important
        this.taskList = newTask.folder_id
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.task-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--v-background-base);
  color: var(--v-secondary-darken-1);
}

.text-h6 {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  color: var(--v-secondary-darken-1) !important;
  line-height: 1.25rem !important;
}

.task-title-container {
  flex: 1;
}

.task-title-field {
  font-size: 1rem !important;
  font-weight: 500 !important;
  color: var(--v-secondary-darken-1) !important;
  line-height: 1.375rem !important;
}

.task-title-field :deep(.v-field__input) {
  min-height: unset !important;
  padding: 0 !important;
}

.task-title-field :deep(.v-field__field) {
  min-height: unset !important;
}

.text-subtitle-2 {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  color: var(--v-textMuted-base) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.02em !important;
}

.v-card {
  background-color: var(--v-surface-base) !important;
  border: 1px solid var(--v-divider-base) !important;
  border-radius: 4px !important;
}

.v-card :deep(.v-field) {
  background-color: var(--v-background-base) !important;
  border-radius: 4px !important;
}

.v-card :deep(.v-field__input) {
  font-size: 0.875rem !important;
  color: var(--v-secondary-darken-1) !important;
}

.v-card :deep(.v-field__outline) {
  border-color: var(--v-divider-base) !important;
}

.v-card :deep(.v-label) {
  font-size: 0.875rem !important;
  color: var(--v-textMuted-base) !important;
}

.v-icon {
  font-size: 18px !important;
}

.text-caption {
  font-size: 0.75rem !important;
  color: var(--v-textMuted-base) !important;
}

.date-picker {
  max-width: 200px;
}

.v-btn {
  font-size: 0.875rem !important;
  letter-spacing: 0 !important;
}

.v-switch :deep(.v-label) {
  font-size: 0.875rem !important;
  color: var(--v-secondary-darken-1) !important;
}
</style>
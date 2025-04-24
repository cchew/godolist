<template>
  <v-list-item
    :value="task.id"
    :disabled="task.completed"
    rounded="lg"
    class="task-item mb-2"
    :class="{ 'task-completed': task.completed }"
    @click="selectTask"
  >
    <template v-slot:prepend>
      <div class="d-flex align-center">
        <v-checkbox
          v-model="isCompleted"
          :disabled="task.completed"
          color="primary"
          hide-details
          @click.stop="toggleComplete"
        />
      </div>
    </template>
    
    <v-list-item-title class="task-title">
      {{ task.title }}
    </v-list-item-title>
    
    <v-list-item-subtitle class="text-caption text-truncate">
      <template v-if="task.dueDate">
        <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-calendar</v-icon>
        <span :class="{'text-error': isOverdue}">{{ formattedDueDate }}</span>
      </template>
      <span v-if="task.notes" class="ml-2 text-truncate">{{ task.notes }}</span>
    </v-list-item-subtitle>
    
    <template v-slot:append>
      <div class="d-flex align-center">
        <v-tooltip location="top" text="Go do">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-play-circle-outline"
              size="small"
              variant="text"
              v-bind="props"
              @click.stop="goDoTask"
            />
          </template>
        </v-tooltip>
        <v-tooltip location="top" :text="task.isImportant ? 'Make regular' : 'Make important'">
          <template v-slot:activator="{ props }">
            <v-btn
              :icon="task.isImportant ? 'mdi-star' : 'mdi-star-outline'"
              size="small"
              :color="task.isImportant ? 'warning' : undefined"
              variant="text"
              v-bind="props"
              @click.stop="toggleImportant"
            />
          </template>
        </v-tooltip>
        
        <v-menu open-on-hover>
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              v-bind="props"
              @click.stop
            />
          </template>
          
          <v-list density="compact" width="200">
            <v-list-item @click.stop="editTask">
              <template v-slot:prepend>
                <v-icon size="small" class="mr-2">mdi-pencil</v-icon>
              </template>
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            
            <v-list-item @click.stop="confirmDeleteTask" class="text-error">
              <template v-slot:prepend>
                <v-icon size="small" class="mr-2 text-error">mdi-delete</v-icon>
              </template>
              <v-list-item-title class="text-error">Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>
  </v-list-item>
</template>

<script>
import { format, isPast, isToday } from 'date-fns'

/**
 * TaskItem component displays a single task with actions
 * @component
 */
export default {
  name: 'TaskItem',
  
  props: {
    /**
     * The task object to display
     * @type {Object}
     * @required
     */
    task: {
      type: Object,
      required: true
    }
  },
  
  computed: {
    /**
     * Task completion status with getter/setter
     * @type {Boolean}
     */
    isCompleted: {
      get() {
        return this.task.completed
      },
      set(value) {
        // This is handled by the toggleComplete method
      }
    },
    
    /**
     * Formatted due date string
     * @returns {string} Formatted date string
     */
    formattedDueDate() {
      if (!this.task.dueDate) return ''
      
      const date = new Date(this.task.dueDate)
      
      if (isToday(date)) {
        return 'Today'
      }
      
      return format(date, 'MMM d')
    },
    
    /**
     * Whether the task is overdue
     * @returns {Boolean} True if task is overdue
     */
    isOverdue() {
      if (!this.task.dueDate || this.task.completed) return false
      
      const dueDate = new Date(this.task.dueDate)
      return isPast(dueDate) && !isToday(dueDate)
    }
  },
  
  methods: {
    /**
     * Emits select event with the task
     */
    selectTask() {
      this.$emit('select', this.task)
    },
    
    /**
     * Emits toggle-complete event with task ID
     */
    toggleComplete() {
      this.$emit('toggle-complete', this.task.id)
    },
    
    /**
     * Emits toggle-important event with task ID
     */
    toggleImportant() {
      this.$emit('toggle-important', this.task.id)
    },
    
    /**
     * Emits update event with the task
     */
    editTask() {
      this.$emit('update', this.task)
    },
    
    /**
     * Confirms and emits delete event with task ID
     */
    confirmDeleteTask() {
      if (confirm(`Delete task "${this.task.title}"?`)) {
        this.$emit('delete', this.task.id)
      }
    },
    
    /**
     * Emits go-do event with the task
     */
    goDoTask() {
      this.$emit('go-do', this.task)
    }
  }
}
</script>

<style scoped>
.task-item {
  transition: all 0.2s;
  border-radius: 4px !important;
  margin-bottom: 1px !important;
  padding: 4px 8px !important;
  min-height: 44px !important;
  color: var(--v-secondary-base) !important;
}

.task-item:hover {
  background-color: var(--v-messageHover-base) !important;
}

.task-item :deep(.v-list-item__content) {
  padding: 0 8px !important;
}

.task-completed .task-title {
  text-decoration: line-through;
  color: var(--v-textMuted-base);
  opacity: 0.7;
}

.task-title {
  font-size: 0.9375rem !important;
  font-weight: 400 !important;
  line-height: 1.375rem !important;
  color: var(--v-secondary-darken-1) !important;
}

.task-subtitle {
  font-size: 0.875rem !important;
  color: var(--v-textMuted-base) !important;
  opacity: 1 !important;
  line-height: 1.25rem !important;
}

.v-btn--icon {
  color: var(--v-textMuted-base) !important;
}

.v-btn--icon:hover {
  color: var(--v-secondary-darken-1) !important;
}

.task-item :deep(.v-selection-control) {
  min-height: 36px !important;
}

.task-item :deep(.v-selection-control__wrapper) {
  opacity: 0.7;
}

.task-item:hover :deep(.v-selection-control__wrapper) {
  opacity: 1;
}
</style>
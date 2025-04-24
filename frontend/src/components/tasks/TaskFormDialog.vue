<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ task ? 'Edit Task' : 'New Task' }}
      </v-card-title>
      
      <v-card-text>
        <v-form @submit.prevent="saveTask">
          <v-text-field
            v-model="taskForm.title"
            label="Task title"
            required
            autofocus
            :rules="[v => !!v || 'Title is required']"
          />
          
          <v-textarea
            v-model="taskForm.notes"
            label="Description"
            rows="3"
            auto-grow
            class="mt-2"
          />
          
          <div class="d-flex align-center gap-4">
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
                  label="Due date"
                  prepend-icon="mdi-calendar"
                  variant="outlined"
                  class="date-picker"
                />
              </template>
              <v-date-picker
                v-model="taskForm.dueDate"
                @update:model-value="dateMenu = false"
              />
            </v-menu>
            
            <v-switch
              v-model="taskForm.isImportant"
              color="warning"
              label="Important"
              hide-details
            />
          </div>
          
          <v-select
            v-model="taskForm.folder_id"
            :items="lists"
            item-title="name"
            item-value="id"
            label="List"
            variant="outlined"
            class="mt-4"
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
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </template>
          </v-select>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="saveTask"
          :disabled="!taskForm.title"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { format } from 'date-fns'

/**
 * TaskFormDialog component provides a form for creating and editing tasks
 * @component
 */
export default {
  name: 'TaskFormDialog',
  
  props: {
    /**
     * Whether the dialog is visible
     * @type {Boolean}
     * @default false
     */
    modelValue: {
      type: Boolean,
      default: false
    },
    
    /**
     * Task object to edit (null for new task)
     * @type {Object}
     * @default null
     */
    task: {
      type: Object,
      default: null
    },
    
    /**
     * ID of the list to assign the task to
     * @type {String}
     * @default 'default'
     */
    listId: {
      type: String,
      default: 'default'
    }
  },
  
  emits: ['update:modelValue', 'save'],
  
  data() {
    return {
      taskForm: {
        id: null,
        title: '',
        notes: '',
        dueDate: null,
        isImportant: false,
        folder_id: null
      },
      dateMenu: false
    }
  },
  
  computed: {
    ...mapGetters('lists', ['allLists']),
    
    /**
     * List of available lists
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
      if (!this.taskForm.dueDate) return ''
      return format(new Date(this.taskForm.dueDate), 'MMM d, yyyy')
    },
    
    /**
     * Default list ID to use
     * @returns {string} List ID
     */
    defaultListId() {
      // Use the provided listId, but only if it's a valid custom list (not special filters)
      if (this.listId === 'all' || this.listId === 'important' || this.listId === 'completed') {
        return 'default'
      }
      return this.listId
    }
  },
  
  watch: {
    /**
     * Watches dialog visibility to initialize form
     * @param {boolean} val - New visibility value
     */
    modelValue(val) {
      if (val) {
        this.initForm()
      }
    }
  },
  
  methods: {
    /**
     * Initializes the form with task data
     */
    initForm() {
      if (this.task) {
        // Edit existing task
        this.taskForm = {
          id: this.task.id,
          title: this.task.title,
          notes: this.task.notes || '',
          dueDate: this.task.dueDate || null,
          isImportant: this.task.isImportant,
          folder_id: this.task.folder_id
        }
      } else {
        // New task
        this.taskForm = {
          id: null,
          title: '',
          notes: '',
          dueDate: null,
          isImportant: false,
          folder_id: this.defaultListId
        }
      }
    },
    
    /**
     * Saves the task form
     */
    saveTask() {
      if (!this.taskForm.title) return
      
      this.$emit('save', { ...this.taskForm })
      this.$emit('update:modelValue', false)
    }
  },
  
  created() {
    this.initForm()
  }
}
</script>

<style scoped>
.date-picker {
  max-width: 180px;
}

.text-h5 {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: var(--v-secondary-darken-1) !important;
  line-height: 1.375rem !important;
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

.v-btn {
  font-size: 0.875rem !important;
  letter-spacing: 0 !important;
}

.v-switch :deep(.v-label) {
  font-size: 0.875rem !important;
  color: var(--v-secondary-darken-1) !important;
}

.v-list-item-title {
  font-size: 0.875rem !important;
  color: var(--v-secondary-darken-1) !important;
}

.v-icon {
  font-size: 18px !important;
}
</style>
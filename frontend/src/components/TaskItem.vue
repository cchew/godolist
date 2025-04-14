<template>
  <div class="task-item-content">
    <label class="checkbox-container" @click.stop>
      <input 
        type="checkbox" 
        :checked="task.completed"
        @change="$emit('toggle', task)"
      />
      <span class="checkmark"></span>
    </label>
    <span :class="{ completed: task.completed }">{{ task.title }}</span>
    <div class="task-actions">
      <button 
        v-if="isAgentTask"
        class="go-do-button"
        @click.stop="$emit('go-do', task)"
        title="Go Do"
      >
        <i class="mdi mdi-robot"></i>
      </button>
      <button 
        class="importance-button" 
        :class="{ important: task.isImportant }"
        @click.stop="$emit('toggle-importance', task.id)"
        title="Toggle Importance"
      >
        <i class="mdi" :class="task.isImportant ? 'mdi-star' : 'mdi-star-outline'"></i>
      </button>
      <button 
        class="delete-button"
        @click.stop="$emit('delete', task.id)"
        title="Delete Task"
      >
        <i class="mdi mdi-delete"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  computed: {
    isAgentTask() {
      // Check if task title contains keywords that match available agents
      const agentKeywords = ['review', 'analyze', 'summarize', 'process'];
      return agentKeywords.some(keyword => 
        this.task.title.toLowerCase().includes(keyword)
      );
    }
  },
  emits: ['toggle', 'toggle-importance', 'go-do', 'delete']
}
</script>

<style scoped>
.task-item-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.completed {
  text-decoration: line-through;
  color: #605e5c;
}

.task-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.go-do-button {
  background: none;
  border: none;
  padding: 4px;
  color: #2564cf;
  cursor: pointer;
  margin-right: 8px;
  transition: transform 0.2s;
}

.go-do-button:hover {
  transform: scale(1.1);
  color: #004578;
}

.importance-button {
  background: none;
  border: none;
  padding: 4px;
  color: #605e5c;
  cursor: pointer;
  margin-right: 8px;
}

.importance-button:hover {
  color: #2564cf;
}

.importance-button.important {
  color: #ffd700;
}

.delete-button {
  background: none;
  border: none;
  padding: 4px;
  color: #605e5c;
  cursor: pointer;
  transition: color 0.2s;
}

.delete-button:hover {
  color: #d13438;
}
</style>
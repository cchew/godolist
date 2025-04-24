<template>
  <div class="chat-list">
    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-6">
      <v-progress-circular indeterminate color="primary" />
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!chats.length" class="empty-chats">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-chat-outline</v-icon>
      <h3 class="text-h5 font-weight-medium text-grey-darken-1">No chats</h3>
      <p class="text-body-1 text-medium-emphasis">
        Start a new chat to get started
      </p>
    </div>
    
    <!-- Chat items -->
    <v-list v-else lines="two" class="chat-list-items">
      <div class="pb-2">
        <v-slide-y-transition group>
          <v-list-item
            v-for="chat in chats"
            :key="chat.id"
            :value="chat.id"
            @click="selectChat(chat)"
            class="chat-item"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" size="40">
                <v-icon color="white">mdi-chat</v-icon>
              </v-avatar>
            </template>
            
            <v-list-item-title class="text-subtitle-1 mb-1">{{ chat.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-body-2">
              {{ chat.lastMessage }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(chat.timestamp) }}
              </div>
            </template>
          </v-list-item>
        </v-slide-y-transition>
      </div>
    </v-list>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ChatList',
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters('chats', ['allChats']),
    
    chats() {
      return this.allChats
    }
  },
  methods: {
    selectChat(chat) {
      this.$emit('select-chat', chat)
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
.chat-list {
  height: 100%;
  overflow-y: auto;
  background-color: var(--v-background-base);
}

.chat-list-items {
  padding: 16px !important;
  background-color: transparent !important;
}

.chat-list-items :deep(.v-list) {
  background-color: transparent !important;
}

.empty-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: var(--v-textMuted-base);
}

.empty-chats .v-icon {
  opacity: 0.5;
  color: var(--v-textMuted-base) !important;
}

.empty-chats h3 {
  margin-bottom: 8px;
  color: var(--v-secondary-darken-1);
}

.empty-chats p {
  color: var(--v-textMuted-base);
}

.chat-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.chat-item:hover {
  background-color: var(--v-surface-base) !important;
}

.chat-item :deep(.v-list-item__content) {
  overflow: hidden;
}

.chat-item :deep(.v-list-item-subtitle) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 
<template>
  <div class="chat-detail">
    <v-card flat class="h-100">
      <v-card-title class="text-h5">
        {{ chat?.name }}
      </v-card-title>
      
      <v-divider />
      
      <ChatInterface
        :task="{
          title: chat?.name || 'Chat'
        }"
        :messages="formattedMessages"
        @send-message="handleSendMessage"
      />
    </v-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ChatInterface from '@/components/chats/ChatInterface'

export default {
  name: 'ChatDetail',
  components: {
    ChatInterface
  },
  
  computed: {
    ...mapGetters('chats', ['getChatById']),
    
    chatId() {
      return this.$route.params.chatId
    },
    
    chat() {
      return this.getChatById(this.chatId)
    },
    
    formattedMessages() {
      if (!this.chat?.messages) return []
      
      return this.chat.messages.map(msg => ({
        role: msg.sender === 'John' ? 'assistant' : 'user',
        content: msg.content
      }))
    }
  },
  
  methods: {
    handleSendMessage(message) {
      this.$store.dispatch('chats/sendMessage', {
        chatId: this.chatId,
        message: {
          id: `msg${this.chat.messages.length + 1}`,
          sender: 'John',
          content: message,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
}
</script>

<style scoped>
.chat-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.h-100 {
  height: 100%;
}
</style> 
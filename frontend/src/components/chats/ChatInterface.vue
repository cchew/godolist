<template>
  <div class="chat-interface">
    <!-- Chat Messages -->
    <div class="messages-container">
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!displayMessages.length && !isHistoricalChat" class="empty-chat">
          <v-icon size="64" color="primary" class="mb-4">mdi-robot</v-icon>
          <h3 class="text-h6">Let's work on "{{ task.title }}"</h3>
          <p class="text-body-1">I'm here to help you complete this task. What would you like to do first?</p>
        </div>
        
        <div v-else class="messages-list">
          <div
            v-for="(message, index) in displayMessages"
            :key="index"
            class="message"
            :class="{ 'message-ai': message.role === 'assistant', 'message-user': message.role === 'user' }"
          >
            <div class="message-avatar" v-if="message.role === 'user'">
              <v-avatar color="primary" size="32">
                <v-icon color="white" size="20">mdi-account</v-icon>
              </v-avatar>
            </div>
            <div class="message-content" :class="{ 'mr-10': message.role === 'assistant', 'ml-10': message.role === 'user' }">
              <div class="message-bubble" :class="{ 'message-bubble-ai': message.role === 'assistant' }">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-feedback" v-if="message.role === 'assistant'">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="white"
                    class="feedback-btn"
                    :class="{ selected: isFeedbackSelected(message, 'up') }"
                    @click="handleFeedback(message, 'up')"
                  >
                    <v-icon>mdi-thumb-up</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="white"
                    class="feedback-btn"
                    :class="{ selected: isFeedbackSelected(message, 'down') }"
                    @click="handleFeedback(message, 'down')"
                  >
                    <v-icon>mdi-thumb-down</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="white"
                    class="feedback-btn"
                    @click="openFeedbackDialog(message)"
                  >
                    <v-icon>mdi-message-text</v-icon>
                  </v-btn>
                </div>
              </div>
              <div class="message-time text-caption text-medium-emphasis">
                {{ formatTime(message.timestamp || new Date()) }}
              </div>
            </div>
            <div class="message-avatar" v-if="message.role === 'assistant'">
              <v-avatar color="grey-lighten-2" size="32">
                <v-img src="https://cdn.vuetifyjs.com/images/logos/v.png" />
              </v-avatar>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input">
      <v-form @submit.prevent="sendMessage" class="d-flex align-center">
        <v-text-field
          v-model="newMessage"
          hide-details
          density="comfortable"
          variant="outlined"
          placeholder="Type a message..."
          class="mr-2"
          @keydown.enter.prevent="handleEnter"
          prepend-inner-icon="mdi-emoticon-outline"
        >
          <template v-slot:append-inner>
            <v-icon color="medium-emphasis">mdi-paperclip</v-icon>
          </template>
        </v-text-field>
        <v-btn
          color="primary"
          icon
          :disabled="!newMessage.trim()"
          @click="sendMessage"
          class="chat-send-btn"
        >
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-form>
    </div>

    <!-- Feedback Dialog -->
    <v-dialog v-model="showFeedbackDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">
          Provide Feedback
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="feedbackText"
            label="Your feedback"
            rows="4"
            variant="outlined"
            :rules="[v => !!v || 'Feedback is required']"
          ></v-textarea>
          <p class="text-caption text-medium-emphasis mt-2">
            This will create a GitHub Issue with the conversation ID. <br/>Please do not provide any sensitive information in your feedback.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showFeedbackDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!feedbackText"
            @click="submitFeedback"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true
})

export default {
  name: 'ChatInterface',
  props: {
    task: {
      type: Object,
      required: true
    },
    messages: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      newMessage: '',
      localMessages: [],
      showFeedbackDialog: false,
      feedbackText: '',
      isPrivateFeedback: true,
      createGitHubIssue: false,
      selectedMessage: null,
      messageFeedback: {} // Track feedback state for each message
    }
  },
  computed: {
    isHistoricalChat() {
      return this.messages.length > 0
    },
    
    displayMessages() {
      return this.isHistoricalChat ? this.messages : this.localMessages
    }
  },
  methods: {
    formatMessage(text) {
      // Convert markdown to HTML
      const html = marked(text)
      
      // Add custom classes to code blocks
      return html.replace(/<pre>/g, '<pre class="code-block">')
    },
    
    formatTime(date) {
      return new Date(date).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase()
    },
    
    handleFeedback(message, type) {
      const messageId = message.id || message.timestamp // Use timestamp as fallback ID
      
      // If clicking the same type, remove feedback
      if (this.messageFeedback[messageId] === type) {
        delete this.messageFeedback[messageId]
      } else {
        // Otherwise, update feedback
        this.messageFeedback[messageId] = type
      }
      
      // TODO: Implement feedback submission
      console.log(`Feedback ${type} for message:`, message)
    },
    
    isFeedbackSelected(message, type) {
      const messageId = message.id || message.timestamp
      return this.messageFeedback[messageId] === type
    },
    
    openFeedbackDialog(message) {
      this.selectedMessage = message
      this.feedbackText = ''
      this.isPrivateFeedback = true
      this.createGitHubIssue = false
      this.showFeedbackDialog = true
    },
    
    submitFeedback() {
      if (!this.feedbackText) return
      
      const feedback = {
        message: this.selectedMessage,
        text: this.feedbackText,
        isPrivate: this.isPrivateFeedback,
        createGitHubIssue: this.createGitHubIssue
      }
      
      console.log('Submitting feedback:', feedback)
      // TODO: Implement feedback submission
      
      this.showFeedbackDialog = false
    },
    
    async sendMessage() {
      const message = this.newMessage.trim()
      if (!message) return
      
      // Add user message
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      }
      
      if (this.isHistoricalChat) {
        this.$emit('send-message', message)
      } else {
        this.localMessages.push(userMessage)
      }
      
      this.newMessage = ''
      
      // Scroll to bottom
      this.$nextTick(() => {
        this.scrollToBottom()
      })
      
      if (!this.isHistoricalChat) {
        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
          this.localMessages.push({
            role: 'assistant',
            content: `I'm here to help with "${this.task.title}". Let me assist you with that.`,
            timestamp: new Date()
          })
          
          // Scroll to bottom after response
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }, 1000)
      }
    },
    
    handleEnter(e) {
      if (e.shiftKey) return
      this.sendMessage()
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      container.scrollTop = container.scrollHeight
    }
  }
}
</script>

<style scoped>
.chat-interface {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--v-background-base);
  position: relative;
}

.messages-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.chat-messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 1.5rem;
}

.empty-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--v-secondary-darken-1);
  padding: 2rem;
}

.empty-chat h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem !important;
}

.empty-chat p {
  color: var(--v-textMuted-base);
  font-size: 0.875rem !important;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-bubble {
  background-color: var(--v-surface-base);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  color: var(--v-secondary-darken-1);
}

.message-bubble-ai {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}

.message-bubble :deep(p) {
  margin: 0.5rem 0;
}

.message-bubble :deep(p:first-child) {
  margin-top: 0;
}

.message-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.message-bubble :deep(ul), 
.message-bubble :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-bubble :deep(li) {
  margin: 0.25rem 0;
}

.message-bubble :deep(code) {
  font-family: 'Fira Code', monospace;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
  background-color: rgba(0, 0, 0, 0.1);
}

.message-bubble-ai :deep(code) {
  background-color: rgba(255, 255, 255, 0.2);
}

.message-bubble :deep(.code-block) {
  margin: 0.75rem 0;
  padding: 1rem;
  border-radius: 8px;
  background-color: #1e1e1e !important;
  overflow-x: auto;
}

.message-bubble :deep(.code-block code) {
  padding: 0;
  background-color: transparent;
  color: #d4d4d4;
}

.message-bubble :deep(a) {
  color: var(--v-primary-base);
  text-decoration: none;
}

.message-bubble-ai :deep(a) {
  color: white;
  text-decoration: underline;
}

.message-bubble :deep(strong) {
  font-weight: 600;
}

.message-time {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  padding: 0 0.5rem;
  color: var(--v-textMuted-base);
}

.message-ai {
  flex-direction: row-reverse;
}

.chat-input {
  border-top: 1px solid var(--v-divider-base);
  padding: 1rem 1.5rem;
  background-color: var(--v-surface-base);
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
}

.chat-input :deep(.v-field) {
  background-color: var(--v-background-base) !important;
  border-radius: 8px !important;
  min-height: 48px;
}

.chat-input :deep(.v-field__input) {
  font-size: 0.875rem !important;
  padding: 0.75rem !important;
  min-height: 48px !important;
  color: var(--v-secondary-darken-1) !important;
  line-height: 1.2;
}

.chat-input :deep(.v-field__outline) {
  border: none !important;
  opacity: 0.08;
}

.chat-input :deep(.v-field__prepend-inner),
.chat-input :deep(.v-field__append-inner) {
  color: var(--v-textMuted-base);
}

.chat-input :deep(.v-field__prepend-inner) {
  padding-inline-start: 0.75rem;
}

.chat-input :deep(.v-field__append-inner) {
  padding-inline-end: 0.75rem;
}

.chat-send-btn {
  margin-top: 4px;
}

/* Custom scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.3);
}

.message-feedback {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.feedback-btn {
  opacity: 0.7;
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 50%;
  padding: 4px;
}

.feedback-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.feedback-btn.selected {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.3) !important;
  color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.message-bubble-ai .feedback-btn.selected {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.4) !important;
}

.message-bubble-ai .feedback-btn {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.message-bubble-ai .feedback-btn:hover {
  background-color: rgba(255, 255, 255, 0.25) !important;
}
</style> 
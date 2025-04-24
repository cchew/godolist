<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <!-- Chat List Sidebar -->
      <v-col cols="12" md="4" lg="3" class="border-e">
        <ChatsList />
      </v-col>
      
      <!-- Chat Interface -->
      <v-col cols="12" md="8" lg="9">
        <router-view />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ChatsList from '@/components/chats/ChatsList'

/**
 * Chats view component provides the chat interface layout
 * @component
 */
export default {
  name: 'ChatsView',
  
  components: {
    ChatsList
  }
}
</script>

<style scoped>
.border-e {
  border-right: 1px solid var(--v-divider-base);
}
</style> 
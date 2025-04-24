<template>
  <v-app-bar flat>
    <v-container class="d-flex align-center py-0 my-0">
      <div class="d-flex align-center">
        <h1 class="text-h5 font-weight-medium">{{ title }}</h1>
      </div>
      
      <v-spacer></v-spacer>
      
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search tasks"
        density="comfortable"
        hide-details
        class="search-field"
        variant="outlined"
        bg-color="white"
      />
      
      <div class="user-menu">
        <v-menu transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              class="ml-2"
              icon
            >
              <v-avatar color="primary" v-if="!user?.photoURL" size="36">
                <span class="text-h6 text-white">{{ userInitials }}</span>
              </v-avatar>
              <v-avatar v-else size="36">
                <v-img :src="user.photoURL" alt="User Avatar" />
              </v-avatar>
            </v-btn>
          </template>
          
          <v-card min-width="200" class="user-menu-card">
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-avatar color="primary" v-if="!user?.photoURL" size="36">
                  <span class="text-h6 text-white">{{ userInitials }}</span>
                </v-avatar>
                <v-avatar v-else size="36" class="mr-3">
                  <v-img :src="user.photoURL" alt="User Avatar" />
                </v-avatar>
                <div class="ml-3">
                  <div class="text-subtitle-1 font-weight-medium">{{ user?.displayName }}</div>
                  <div class="text-caption text-medium-emphasis">{{ user?.email }}</div>
                </div>
              </div>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <v-btn
                block
                variant="text"
                color="error"
                prepend-icon="mdi-logout"
                @click="logout"
              >
                Sign Out
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </div>
    </v-container>
  </v-app-bar>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppHeader',
  props: {
    title: {
      type: String,
      default: 'Tasks'
    }
  },
  data() {
    return {
      searchQuery: ''
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser']),
    ...mapGetters('tasks', ['searchTasks']),
    
    user() {
      return this.currentUser
    },
    
    userInitials() {
      if (!this.user?.displayName) return '?'
      return this.user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
    },

    filteredTasks() {
      const currentListId = this.$route.params.listId || 'all'
      return this.searchTasks(this.searchQuery, currentListId)
    }
  },
  methods: {
    ...mapActions('auth', ['logout']),
    ...mapActions('tasks', ['setSelectedTask']),
    
    async handleLogout() {
      try {
        await this.logout()
        this.$router.push('/login')
      } catch (error) {
        console.error('Logout failed', error)
      }
    }
  },
  watch: {
    searchQuery(val) {
      this.$emit('search', this.filteredTasks)
    }
  }
}
</script>

<style scoped>
.v-app-bar {
  background-color: var(--v-header-base) !important;
  border-bottom: 1px solid var(--v-divider-base) !important;
  height: 48px !important;
}

.text-h5 {
  color: var(--v-secondary-darken-1) !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  line-height: 48px !important;
}

.search-field {
  max-width: 240px;
  background-color: #1E1F22 !important;
  border-radius: 4px;
  height: 28px !important;
  min-height: 28px !important;
}

.search-field :deep(.v-field__input) {
  color: var(--v-secondary-darken-1) !important;
  font-size: 0.875rem !important;
  min-height: 28px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.search-field :deep(.v-field__outline) {
  border-color: transparent !important;
  opacity: 1 !important;
}

.search-field :deep(.v-field__overlay) {
  background-color: transparent !important;
  opacity: 1 !important;
}

.search-field :deep(.v-icon) {
  color: var(--v-textMuted-base) !important;
  font-size: 18px !important;
}

.user-menu-card {
  background-color: #1E1F22 !important;
  color: var(--v-secondary-darken-1) !important;
  border-radius: 4px;
  margin-top: 8px !important;
}

.user-menu-card :deep(.v-card-text) {
  color: var(--v-secondary-darken-1) !important;
}

.user-menu-card :deep(.text-medium-emphasis) {
  color: var(--v-textMuted-base) !important;
}

@media (max-width: 600px) {
  .search-field {
    display: none;
  }
}
</style>
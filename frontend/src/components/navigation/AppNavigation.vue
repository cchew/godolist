<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    @update:rail="handleRailChange"
    width="280"
    class="app-navigation"
    :elevation="0"
  >
    <v-list-item 
      prepend-avatar="https://cdn.vuetifyjs.com/images/logos/v.png"
      :title="rail ? '' : 'Go Do List'"
      nav
    >
      <template v-slot:append>
        <v-btn 
          icon
          @click.stop="rail = !rail"
        >
          <v-icon>{{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
        </v-btn>
      </template>
    </v-list-item>

    <v-divider />

    <v-list class="pa-2">
      <v-list-item
        prepend-icon="mdi-home"
        title="All Tasks"
        :value="'all'"
        :to="'/tasks'"
        :active="currentRoute === 'all'"
        rounded="lg"
      />
      
      <v-list-item
        prepend-icon="mdi-chat"
        title="All Chats"
        :value="'chats'"
        :to="'/chats'"
        :active="currentRoute === 'chats'"
        rounded="lg"
      />
      
      <v-list-item
        prepend-icon="mdi-star"
        title="Important"
        :value="'important'"
        :to="'/lists/important'"
        :active="currentRoute === 'important'"
        rounded="lg"
      />
      
      <v-list-item
        prepend-icon="mdi-check-circle"
        title="Completed"
        :value="'completed'"
        :to="'/lists/completed'"
        :active="currentRoute === 'completed'"
        rounded="lg"
      />
    </v-list>

    <v-divider class="my-2" />

    <v-list v-if="!rail" class="d-flex align-center px-3">
      <div class="text-caption font-weight-medium text-uppercase text-medium-emphasis">
        My Lists
      </div>
      <v-spacer></v-spacer>
      <v-btn
        size="small"
        icon="mdi-plus"
        variant="text"
        density="compact"
        @click="openNewListDialog"
      />
    </v-list>

    <v-list class="pa-2">
      <v-list-item
        v-for="list in lists"
        :key="list.id"
        :prepend-icon="list.icon"
        :title="rail ? '' : list.name"
        :value="list.id"
        :to="`/lists/${list.id}`"
        :active="currentRoute === list.id"
        rounded="lg"
      >
        <template v-slot:append v-if="!rail && list.id !== 'default'">
          <v-menu location="end">
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                density="comfortable"
                v-bind="props"
                size="small"
              />
            </template>
            <v-list density="compact" width="200">
              <v-list-item @click="editList(list)">
                <template v-slot:prepend>
                  <v-icon size="small" class="mr-2">mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="confirmDeleteList(list)" class="text-error">
                <template v-slot:prepend>
                  <v-icon size="small" class="mr-2 text-error">mdi-delete</v-icon>
                </template>
                <v-list-item-title class="text-error">Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-list-item>
    </v-list>
    
    <!-- New List Dialog -->
    <v-dialog v-model="showListDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          {{ editingList ? 'Edit List' : 'New List' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveList">
            <v-text-field
              v-model="listForm.name"
              label="List Name"
              required
              autofocus
              :rules="[v => !!v || 'Name is required']"
            />
            
            <v-select
              v-model="listForm.icon"
              label="Icon"
              :items="listIcons"
              item-title="title"
              variant="outlined"
              class="mt-2"
            >
              <template v-slot:selection="{ item }">
                <v-icon :icon="item.value" class="mr-2" />
                {{ item.title }}
              </template>
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon :icon="item.value" />
                  </template>
                </v-list-item>
              </template>
            </v-select>
            
            <v-select
              v-model="listForm.color"
              label="List Colour"
              :items="listColors"
              item-title="label"
              variant="outlined"
              class="mt-2"
            >
              <template v-slot:selection="{ item }">
                <v-avatar :color="item.value" size="24" class="mr-2">
                  <span v-if="listForm.color === item.value" class="text-white">
                    <v-icon size="small">mdi-check</v-icon>
                  </span>
                </v-avatar>
                {{ item.label }}
              </template>
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-avatar :color="item.value" size="24">
                      <span v-if="listForm.color === item.value" class="text-white">
                        <v-icon size="small">mdi-check</v-icon>
                      </span>
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showListDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveList"
            :disabled="!listForm.name"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Delete List
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ deleteList?.name }}</strong>? 
          All tasks will be unassigned.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteListConfirmed"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppNavigation',
  data() {
    return {
      drawer: true,
      rail: false,
      showListDialog: false,
      showDeleteDialog: false,
      editingList: null,
      selectedListToDelete: null,
      listForm: {
        name: '',
        icon: 'mdi-format-list-bulleted',
        color: 'primary'
      },
      listIcons: [
        { title: 'List', value: 'mdi-format-list-bulleted' },
        { title: 'Home', value: 'mdi-home' },
        { title: 'Work', value: 'mdi-briefcase' },
        { title: 'Shopping', value: 'mdi-cart' },
        { title: 'School', value: 'mdi-school' },
        { title: 'Personal', value: 'mdi-account' },
        { title: 'Health', value: 'mdi-heart' },
        { title: 'Travel', value: 'mdi-airplane' },
        { title: 'Finance', value: 'mdi-currency-usd' }
      ],
      listColors: [
        { label: 'Blue', value: 'primary' },
        { label: 'Red', value: 'error' },
        { label: 'Green', value: 'success' },
        { label: 'Orange', value: 'warning' },
        { label: 'Purple', value: 'purple' }
      ]
    }
  },
  computed: {
    ...mapGetters('lists', ['allLists']),
    
    lists() {
      return this.allLists
    },
    
    currentRoute() {
      if (this.$route.path === '/chats') {
        return 'chats'
      }
      return this.$route.params.listId || 'all'
    }
  },
  methods: {
    ...mapActions('lists', ['addList', 'updateList', 'deleteList']),
    
    handleRailChange(value) {
      this.rail = value
    },
    
    openNewListDialog() {
      this.editingList = null
      this.listForm = {
        name: '',
        icon: 'mdi-format-list-bulleted',
        color: 'primary'
      }
      this.showListDialog = true
    },
    
    editList(list) {
      this.editingList = list
      this.listForm = {
        name: list.name,
        icon: list.icon,
        color: list.color
      }
      this.showListDialog = true
    },
    
    saveList() {
      if (!this.listForm.name) return
      
      if (this.editingList) {
        this.updateList({
          id: this.editingList.id,
          updates: this.listForm
        })
      } else {
        this.addList(this.listForm)
      }
      
      this.showListDialog = false
    },
    
    confirmDeleteList(list) {
      this.selectedListToDelete = list
      this.showDeleteDialog = true
    },
    
    deleteListConfirmed() {
      if (this.selectedListToDelete) {
        this.deleteList({ id: this.selectedListToDelete.id })
        if (this.currentRoute === this.selectedListToDelete.id) {
          this.$router.push('/tasks')
        }
      }
      this.showDeleteDialog = false
    }
  }
}
</script>

<style scoped>
.app-navigation {
  background-color: var(--v-sidebar-base) !important;
  border-right: 1px solid var(--v-divider-base);
}

.v-list {
  background-color: transparent !important;
  padding: 0 8px !important;
}

.v-list-item {
  min-height: 32px !important;
  padding: 0 8px !important;
  margin-bottom: 2px;
  border-radius: 4px !important;
  color: var(--v-textMuted-base) !important;
  font-size: 0.9375rem !important;
}

.v-list-item:hover {
  background-color: var(--v-channelHover-base) !important;
  color: var(--v-secondary-darken-1) !important;
}

.v-list-item--active {
  background-color: var(--v-channelHover-base) !important;
  color: var(--v-secondary-darken-1) !important;
}

.v-list-item-title {
  font-size: 0.9375rem !important;
  font-weight: 400 !important;
  color: var(--v-textMuted-base) !important;
}

.v-list-item--active .v-list-item-title {
  color: var(--v-secondary-darken-1) !important;
}

.text-caption {
  color: var(--v-textMuted-base) !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.02em !important;
  padding: 18px 8px 4px 8px !important;
}

.v-divider {
  border-color: var(--v-divider-base) !important;
  margin: 8px 0 !important;
  opacity: 0.6 !important;
}

.v-list-item :deep(.v-icon) {
  color: var(--v-textMuted-base) !important;
  font-size: 18px !important;
}

.v-list-item--active :deep(.v-icon) {
  color: var(--v-secondary-darken-1) !important;
}
</style>
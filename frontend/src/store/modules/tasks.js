import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const state = {
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null
}

const getters = {
  allTasks: (state) => state.tasks,
  
  tasksByList: (state) => (listId) => {
    console.log('Filtering tasks for listId:', listId, 'Current tasks:', state.tasks)
    if (listId === 'important') {
      return state.tasks.filter(task => task.isImportant)
    } else if (listId === 'completed') {
      return state.tasks.filter(task => task.completed)
    } else if (listId === 'all') {
      return state.tasks
    } else if (listId) {
      // Convert listId to number for comparison with folder_id
      const folderId = parseInt(listId)
      return state.tasks.filter(task => task.folder_id === folderId)
    }
    return state.tasks
  },
  
  searchTasks: (state) => (query, listId) => {
    if (!query) {
      // When no search query, respect the current list filter
      if (listId === 'important') {
        return state.tasks.filter(task => task.isImportant)
      } else if (listId === 'completed') {
        return state.tasks.filter(task => task.completed)
      } else if (listId) {
        return state.tasks.filter(task => task.folder_id === listId)
      }
      return state.tasks
    }
    
    const searchTerm = query.toLowerCase()
    return state.tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm)
      const descriptionMatch = task.notes?.toLowerCase().includes(searchTerm) || false
      return titleMatch || descriptionMatch
    })
  },
  
  isLoading: (state) => state.loading,
  error: (state) => state.error,
  selectedTask: (state) => state.selectedTask,
  
  completedTasks: (state) => state.tasks.filter(task => task.completed),
  importantTasks: (state) => state.tasks.filter(task => task.isImportant),
  
  taskById: (state) => (id) => {
    return state.tasks.find(task => task.id === id)
  }
}

const actions = {
  async fetchTasks({ commit }, folderId = null) {
    commit('SET_LOADING', true)
    try {
      console.log('Fetching tasks for folderId:', folderId)
      const response = await axios.get('http://127.0.0.1:5000/tasks', {
        params: { folder_id: folderId }
      })
      console.log('Tasks API response:', response.data)
      commit('SET_TASKS', response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      commit('SET_ERROR', error.response?.data?.error || error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async addTask({ commit }, task) {
    commit('SET_LOADING', true)
    try {
      console.log('Adding task:', task)
      // Map frontend field names to backend API field names
      const apiTask = {
        title: task.title,
        notes: task.description || task.notes || '',
        completed: false,
        isImportant: task.important || task.isImportant || false,
        folder_id: task.folder_id || task.listId || null
      }
      
      const response = await axios.post('http://127.0.0.1:5000/tasks', apiTask)
      
      // Map backend response back to frontend field names
      const newTask = {
        ...response.data,
        description: response.data.notes,
        important: response.data.isImportant,
        listId: response.data.folder_id
      }
      
      commit('ADD_TASK', newTask)
      return newTask
    } catch (error) {
      console.error('Error adding task:', error)
      commit('SET_ERROR', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async updateTask({ commit }, { id, updates }) {
    commit('SET_LOADING', true)
    try {
      console.log('Updating task:', id, updates)
      // Map frontend field names to backend API field names
      const apiUpdates = {
        title: updates.title,
        notes: updates.description || updates.notes,
        completed: updates.completed,
        isImportant: updates.important || updates.isImportant,
        folder_id: updates.folder_id || updates.listId
      }
      
      const response = await axios.patch(`http://127.0.0.1:5000/tasks?id=${id}`, apiUpdates)
      
      // Map backend response back to frontend field names
      const frontendUpdates = {
        ...response.data,
        description: response.data.notes,
        important: response.data.isImportant,
        listId: response.data.folder_id
      }
      
      commit('UPDATE_TASK', { id, updates: frontendUpdates })
      return frontendUpdates
    } catch (error) {
      console.error('Error updating task:', error)
      commit('SET_ERROR', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async deleteTask({ commit }, id) {
    commit('SET_LOADING', true)
    try {
      console.log('Deleting task:', id)
      await axios.delete(`http://127.0.0.1:5000/tasks?id=${id}`)
      commit('DELETE_TASK', id)
    } catch (error) {
      console.error('Error deleting task:', error)
      commit('SET_ERROR', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  toggleTaskCompletion({ dispatch, getters }, id) {
    const task = getters.taskById(id)
    if (task) {
      dispatch('updateTask', {
        id,
        updates: { completed: !task.completed }
      })
    }
  },
  
  toggleTaskImportance({ dispatch, getters }, id) {
    const task = getters.taskById(id)
    if (task) {
      dispatch('updateTask', {
        id,
        updates: { isImportant: !task.isImportant }
      })
    }
  },
  
  setSelectedTask({ commit }, task) {
    commit('SET_SELECTED_TASK', task)
  }
}

const mutations = {
  SET_TASKS(state, tasks) {
    console.log('Setting tasks in state:', tasks)
    state.tasks = tasks
  },
  
  ADD_TASK(state, task) {
    state.tasks.push(task)
  },
  
  UPDATE_TASK(state, { id, updates }) {
    const index = state.tasks.findIndex(task => task.id === id)
    if (index !== -1) {
      state.tasks[index] = { ...state.tasks[index], ...updates }
      
      // Update selected task if it's the one being modified
      if (state.selectedTask && state.selectedTask.id === id) {
        state.selectedTask = { ...state.selectedTask, ...updates }
      }
    }
  },
  
  DELETE_TASK(state, id) {
    state.tasks = state.tasks.filter(task => task.id !== id)
    
    // Clear selected task if it's the one being deleted
    if (state.selectedTask && state.selectedTask.id === id) {
      state.selectedTask = null
    }
  },
  
  SET_SELECTED_TASK(state, task) {
    state.selectedTask = task
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  
  SET_ERROR(state, error) {
    state.error = error
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
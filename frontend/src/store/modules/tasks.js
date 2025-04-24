/**
 * Tasks store module
 * @module store/modules/tasks
 */

import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

/**
 * Initial state for the tasks module
 * @type {Object}
 */
const state = {
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null
}

/**
 * Getters for the tasks module
 * @type {Object}
 */
const getters = {
  /**
   * All tasks
   * @param {Object} state - Module state
   * @returns {Array} Array of task objects
   */
  allTasks: (state) => state.tasks,
  
  /**
   * Tasks filtered by list ID
   * @param {Object} state - Module state
   * @returns {Function} Function that takes listId and returns filtered tasks
   */
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
  
  /**
   * Search tasks by query and list ID
   * @param {Object} state - Module state
   * @returns {Function} Function that takes query and listId and returns filtered tasks
   */
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
  
  /**
   * Whether tasks are loading
   * @param {Object} state - Module state
   * @returns {boolean} True if loading
   */
  isLoading: (state) => state.loading,
  
  /**
   * Current error message
   * @param {Object} state - Module state
   * @returns {string|null} Error message or null
   */
  error: (state) => state.error,
  
  /**
   * Currently selected task
   * @param {Object} state - Module state
   * @returns {Object|null} Selected task or null
   */
  selectedTask: (state) => state.selectedTask,
  
  /**
   * Completed tasks
   * @param {Object} state - Module state
   * @returns {Array} Array of completed tasks
   */
  completedTasks: (state) => state.tasks.filter(task => task.completed),
  
  /**
   * Important tasks
   * @param {Object} state - Module state
   * @returns {Array} Array of important tasks
   */
  importantTasks: (state) => state.tasks.filter(task => task.isImportant),
  
  /**
   * Get task by ID
   * @param {Object} state - Module state
   * @returns {Function} Function that takes task ID and returns task object
   */
  taskById: (state) => (id) => {
    return state.tasks.find(task => task.id === id)
  }
}

/**
 * Actions for the tasks module
 * @type {Object}
 */
const actions = {
  /**
   * Fetch tasks from the API
   * @param {Object} context - Vuex context
   * @param {string|null} folderId - Optional folder ID to filter by
   */
  async fetchTasks({ commit }, folderId = null) {
    commit('setLoading', true)
    try {
      console.log('Fetching tasks for folderId:', folderId)
      const response = await axios.get('http://127.0.0.1:5000/tasks', {
        params: { folder_id: folderId }
      })
      console.log('Tasks API response:', response.data)
      commit('setTasks', response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      commit('setError', error.response?.data?.error || error.message)
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Add a new task
   * @param {Object} context - Vuex context
   * @param {Object} task - Task to add
   * @returns {Promise<Object>} Added task
   * @throws {Error} If task addition fails
   */
  async addTask({ commit }, task) {
    commit('setLoading', true)
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
      
      commit('addTask', newTask)
      return newTask
    } catch (error) {
      console.error('Error adding task:', error)
      commit('setError', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Update an existing task
   * @param {Object} context - Vuex context
   * @param {Object} payload - Payload containing task ID and updates
   * @returns {Promise<Object>} Updated task
   * @throws {Error} If task update fails
   */
  async updateTask({ commit }, { id, updates }) {
    commit('setLoading', true)
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
      
      commit('updateTask', { id, updates: frontendUpdates })
      return frontendUpdates
    } catch (error) {
      console.error('Error updating task:', error)
      commit('setError', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Delete a task
   * @param {Object} context - Vuex context
   * @param {string} id - Task ID to delete
   * @throws {Error} If task deletion fails
   */
  async deleteTask({ commit }, id) {
    commit('setLoading', true)
    try {
      console.log('Deleting task:', id)
      await axios.delete(`http://127.0.0.1:5000/tasks?id=${id}`)
      commit('deleteTask', id)
    } catch (error) {
      console.error('Error deleting task:', error)
      commit('setError', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Toggle task completion status
   * @param {Object} context - Vuex context
   * @param {string} id - Task ID to toggle
   */
  toggleTaskCompletion({ dispatch, getters }, id) {
    const task = getters.taskById(id)
    if (task) {
      dispatch('updateTask', {
        id,
        updates: { completed: !task.completed }
      })
    }
  },
  
  /**
   * Toggle task importance status
   * @param {Object} context - Vuex context
   * @param {string} id - Task ID to toggle
   */
  toggleTaskImportance({ dispatch, getters }, id) {
    const task = getters.taskById(id)
    if (task) {
      dispatch('updateTask', {
        id,
        updates: { isImportant: !task.isImportant }
      })
    }
  },
  
  /**
   * Set the selected task
   * @param {Object} context - Vuex context
   * @param {Object} task - Task to select
   */
  setSelectedTask({ commit }, task) {
    commit('setSelectedTask', task)
  }
}

/**
 * Mutations for the tasks module
 * @type {Object}
 */
const mutations = {
  /**
   * Set all tasks
   * @param {Object} state - Module state
   * @param {Array} tasks - Array of task objects
   */
  setTasks(state, tasks) {
    console.log('Setting tasks in state:', tasks)
    state.tasks = tasks
  },
  
  /**
   * Add a new task
   * @param {Object} state - Module state
   * @param {Object} task - Task to add
   */
  addTask(state, task) {
    state.tasks.push(task)
  },
  
  /**
   * Update an existing task
   * @param {Object} state - Module state
   * @param {Object} payload - Payload containing task ID and updates
   */
  updateTask(state, { id, updates }) {
    const index = state.tasks.findIndex(task => task.id === id)
    if (index !== -1) {
      state.tasks[index] = { ...state.tasks[index], ...updates }
      
      // Update selected task if it's the one being modified
      if (state.selectedTask && state.selectedTask.id === id) {
        state.selectedTask = { ...state.selectedTask, ...updates }
      }
    }
  },
  
  /**
   * Delete a task
   * @param {Object} state - Module state
   * @param {string} id - Task ID to delete
   */
  deleteTask(state, id) {
    state.tasks = state.tasks.filter(task => task.id !== id)
    
    // Clear selected task if it's the one being deleted
    if (state.selectedTask && state.selectedTask.id === id) {
      state.selectedTask = null
    }
  },
  
  /**
   * Set the selected task
   * @param {Object} state - Module state
   * @param {Object|null} task - Task to select or null
   */
  setSelectedTask(state, task) {
    state.selectedTask = task
  },
  
  /**
   * Set loading state
   * @param {Object} state - Module state
   * @param {boolean} loading - Loading state
   */
  setLoading(state, loading) {
    state.loading = loading
  },
  
  /**
   * Set error message
   * @param {Object} state - Module state
   * @param {string|null} error - Error message or null
   */
  setError(state, error) {
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
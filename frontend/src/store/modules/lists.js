/**
 * Lists store module
 * @module store/modules/lists
 */

import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

/**
 * Initial state for the lists module
 * @type {Object}
 */
const state = {
  lists: [],
  loading: false,
  error: null
}

/**
 * Getters for the lists module
 * @type {Object}
 */
const getters = {
  /**
   * All lists
   * @param {Object} state - Module state
   * @returns {Array} Array of list objects
   */
  allLists: (state) => state.lists,
  
  /**
   * Get list by ID
   * @param {Object} state - Module state
   * @returns {Function} Function that takes list ID and returns list object
   */
  getListById: (state) => (id) => {
    return state.lists.find(list => list.id === id)
  },
  
  /**
   * Whether lists are loading
   * @param {Object} state - Module state
   * @returns {boolean} True if loading
   */
  isLoading: (state) => state.loading,
  
  /**
   * Current error message
   * @param {Object} state - Module state
   * @returns {string|null} Error message or null
   */
  error: (state) => state.error
}

/**
 * Actions for the lists module
 * @type {Object}
 */
const actions = {
  /**
   * Fetch lists from the API
   * @param {Object} context - Vuex context
   * @throws {Error} If list fetching fails
   */
  async fetchLists({ commit }) {
    commit('setLoading', true)
    try {
      const response = await axios.get('http://127.0.0.1:5000/folders')
      console.log(`fetchList response`, response.data);
      // Ensure we're getting an array of folder objects
      if (Array.isArray(response.data)) {
        commit('setLists', response.data)
      } else {
        console.error('Unexpected API response format:', response.data)
        commit('setError', 'Invalid API response format')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      commit('setError', error.response?.data?.error || error.message)
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Add a new list
   * @param {Object} context - Vuex context
   * @param {Object} list - List to add
   * @returns {Promise<Object>} Added list
   * @throws {Error} If list addition fails
   */
  async addList({ commit }, list) {
    commit('setLoading', true)
    try {
      const response = await axios.post('http://127.0.0.1:5000/folders', {
        name: list.name,
        dueDate: list.dueDate,
        createdAt: list.createdAt
      })
      
      const newList = {
        id: response.data.id,
        name: response.data.name,
        dueDate: response.data.dueDate,
        createdAt: response.data.createdAt
      }
      
      commit('addList', newList)
      return newList
    } catch (error) {
      commit('setError', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Update an existing list
   * @param {Object} context - Vuex context
   * @param {Object} payload - Payload containing list ID and updates
   * @throws {Error} If list update fails
   */
  async updateList({ commit }, { id, updates }) {
    commit('setLoading', true)
    try {
      // First update the folder name
      if (updates.name) {
        await axios.patch(`http://127.0.0.1:5000/folders/${id}`, {
          name: updates.name,
          dueDate: updates.dueDate
        })
      }
      
      // Then update any tasks in this folder
      if (updates.tasks) {
        const tasks = updates.tasks
        for (const task of tasks) {
          await axios.patch('http://127.0.0.1:5000/tasks', {
            id: task.id,
            folder_id: id,
            dueDate: task.dueDate
          })
        }
      }
      
      commit('updateList', { id, updates })
    } catch (error) {
      commit('setError', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Delete a list
   * @param {Object} context - Vuex context
   * @param {string} id - List ID to delete
   * @throws {Error} If list deletion fails
   */
  async deleteList({ commit, dispatch }, id) {
    commit('setLoading', true)
    try {
      // First get all tasks in this folder
      const response = await axios.get('http://127.0.0.1:5000/tasks', {
        params: { folder_id: id }
      })
      
      // Move all tasks to unassigned (null folder_id)
      for (const task of response.data) {
        await axios.patch('http://127.0.0.1:5000/tasks', {
          id: task.id,
          folder_id: null
        })
      }
      
      // Delete the folder
      await axios.delete(`http://127.0.0.1:5000/folders/${id}`)
      
      commit('deleteList', id)
    } catch (error) {
      commit('setError', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

/**
 * Mutations for the lists module
 * @type {Object}
 */
const mutations = {
  /**
   * Set all lists
   * @param {Object} state - Module state
   * @param {Array} lists - Array of list objects
   */
  setLists(state, lists) {
    state.lists = lists
  },
  
  /**
   * Add a new list
   * @param {Object} state - Module state
   * @param {Object} list - List to add
   */
  addList(state, list) {
    state.lists.push(list)
  },
  
  /**
   * Update an existing list
   * @param {Object} state - Module state
   * @param {Object} payload - Payload containing list ID and updates
   */
  updateList(state, { id, updates }) {
    const index = state.lists.findIndex(list => list.id === id)
    if (index !== -1) {
      state.lists[index] = { ...state.lists[index], ...updates }
    }
  },
  
  /**
   * Delete a list
   * @param {Object} state - Module state
   * @param {string} id - List ID to delete
   */
  deleteList(state, id) {
    state.lists = state.lists.filter(list => list.id !== id)
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
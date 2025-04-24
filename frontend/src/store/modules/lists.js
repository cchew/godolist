import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const state = {
  lists: [],
  loading: false,
  error: null
}

const getters = {
  allLists: (state) => state.lists,
  
  getListById: (state) => (id) => {
    return state.lists.find(list => list.id === id)
  },
  
  isLoading: (state) => state.loading,
  error: (state) => state.error
}

const actions = {
  async fetchLists({ commit }) {
    commit('SET_LOADING', true)
    try {
      const response = await axios.get('http://127.0.0.1:5000/folders')
      console.log(`fetchList response`, response.data);
      // Ensure we're getting an array of folder objects
      if (Array.isArray(response.data)) {
        commit('SET_LISTS', response.data)
      } else {
        console.error('Unexpected API response format:', response.data)
        commit('SET_ERROR', 'Invalid API response format')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      commit('SET_ERROR', error.response?.data?.error || error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async addList({ commit }, list) {
    commit('SET_LOADING', true)
    try {
      const response = await axios.post('http://127.0.0.1:5000/folders', {
        name: list.name
      })
      
      const newList = {
        id: response.data.id,
        name: response.data.name
      }
      
      commit('ADD_LIST', newList)
      return newList
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async updateList({ commit }, { id, updates }) {
    commit('SET_LOADING', true)
    try {
      // First update the folder name
      if (updates.name) {
        await axios.patch(`http://127.0.0.1:5000/folders/${id}`, {
          name: updates.name
        })
      }
      
      // Then update any tasks in this folder
      if (updates.tasks) {
        const tasks = updates.tasks
        for (const task of tasks) {
          await axios.patch('http://127.0.0.1:5000/tasks', {
            id: task.id,
            folder_id: id
          })
        }
      }
      
      commit('UPDATE_LIST', { id, updates })
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async deleteList({ commit, dispatch }, id) {
    commit('SET_LOADING', true)
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
      
      commit('DELETE_LIST', id)
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

const mutations = {
  SET_LISTS(state, lists) {
    state.lists = lists
  },
  
  ADD_LIST(state, list) {
    state.lists.push(list)
  },
  
  UPDATE_LIST(state, { id, updates }) {
    const index = state.lists.findIndex(list => list.id === id)
    if (index !== -1) {
      state.lists[index] = { ...state.lists[index], ...updates }
    }
  },
  
  DELETE_LIST(state, id) {
    state.lists = state.lists.filter(list => list.id !== id)
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
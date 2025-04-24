/**
 * Authentication store module
 * @module store/modules/auth
 */

import { getCurrentUser, signInWithGoogle, logoutUser } from '../../services/firebase'

/**
 * Initial state for the auth module
 * @type {Object}
 */
const state = {
  user: null,
  loading: true,
  error: null
}

/**
 * Getters for the auth module
 * @type {Object}
 */
const getters = {
  /**
   * Whether the user is authenticated
   * @param {Object} state - Module state
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated: (state) => !!state.user,
  
  /**
   * Current user object
   * @param {Object} state - Module state
   * @returns {Object|null} User object or null
   */
  currentUser: (state) => state.user,
  
  /**
   * Whether authentication is in progress
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
 * Actions for the auth module
 * @type {Object}
 */
const actions = {
  /**
   * Initialize authentication state
   * @param {Object} context - Vuex context
   */
  async initAuth({ commit }) {
    commit('setLoading', true)
    try {
      // TODO: Re-enable authentication when ready
      // Mock user for development
      const mockUser = {
        uid: 'mock-user-id',
        email: 'mock@example.com',
        displayName: 'Test User',
        photoURL: null
      }
      commit('setUser', mockUser)
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Sign in with Google
   * @param {Object} context - Vuex context
   * @returns {Promise<Object>} User object
   * @throws {Error} If sign in fails
   */
  async googleLogin({ commit }) {
    commit('setLoading', true)
    commit('setError', null)
    try {
      const { user } = await signInWithGoogle()
      commit('setUser', user)
      return user
    } catch (error) {
      commit('setError', error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  },
  
  /**
   * Sign out the current user
   * @param {Object} context - Vuex context
   * @throws {Error} If sign out fails
   */
  async logout({ commit }) {
    commit('setLoading', true)
    try {
      await logoutUser()
      commit('setUser', null)
    } catch (error) {
      commit('setError', error.message)
      throw error
    } finally {
      commit('setLoading', false)
    }
  }
}

/**
 * Mutations for the auth module
 * @type {Object}
 */
const mutations = {
  /**
   * Set the current user
   * @param {Object} state - Module state
   * @param {Object|null} user - User object or null
   */
  setUser(state, user) {
    state.user = user
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
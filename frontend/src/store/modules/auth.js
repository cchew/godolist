import { getCurrentUser, signInWithGoogle, logoutUser } from '../../services/firebase'

const state = {
  user: null,
  loading: true,
  error: null
}

const getters = {
  isAuthenticated: (state) => !!state.user,
  currentUser: (state) => state.user,
  isLoading: (state) => state.loading,
  error: (state) => state.error
}

const actions = {
  async initAuth({ commit }) {
    commit('SET_LOADING', true)
    try {
      // TODO: Re-enable authentication when ready
      // Mock user for development
      const mockUser = {
        uid: 'mock-user-id',
        email: 'mock@example.com',
        displayName: 'Test User',
        photoURL: null
      }
      commit('SET_USER', mockUser)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async googleLogin({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const { user } = await signInWithGoogle()
      commit('SET_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async logout({ commit }) {
    commit('SET_LOADING', true)
    try {
      await logoutUser()
      commit('SET_USER', null)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
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
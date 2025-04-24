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

const mutations = {
  setUser(state, user) {
    state.user = user
  },
  setLoading(state, loading) {
    state.loading = loading
  },
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
<template>
  <div class="login-container">
    <v-container fluid class="fill-height">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="4">
          <v-card class="login-card elevation-8">
            <v-card-title class="text-center pt-8 pb-4">
              <v-icon size="56" color="primary" class="mb-4">mdi-checkbox-marked-circle-outline</v-icon>
              <h1 class="text-h4 font-weight-medium">Go Do List</h1>
              <p class="text-subtitle-1 text-medium-emphasis mt-2">Sign in to manage your tasks</p>
            </v-card-title>
            
            <v-card-text>
              <v-alert v-if="error" type="error" dense>
                {{ error }}
              </v-alert>
              
              <v-btn
                block
                color="primary"
                variant="elevated"
                size="large"
                class="mb-4 elevation-0"
                @click="signInWithGoogle"
                prepend-icon="mdi-google"
                :loading="loading"
              >
                Sign in with Google
              </v-btn>
              
              <div class="text-caption text-center text-medium-emphasis mt-6">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

/**
 * Login component provides user authentication
 * @component
 */
export default {
  name: 'Login',
  
  computed: {
    ...mapGetters('auth', ['error', 'isLoading']),
    
    /**
     * Whether authentication is in progress
     * @returns {boolean} True if loading
     */
    loading() {
      return this.isLoading
    }
  },
  
  methods: {
    ...mapActions('auth', ['googleLogin']),
    
    /**
     * Handles Google sign-in
     */
    async signInWithGoogle() {
      // TODO: Re-enable authentication when ready
      // Previous implementation: await this.googleLogin()
      this.$router.push('/tasks')
    }
  }
}
</script>

<style scoped>
.login-container {
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.login-card {
  border-radius: 12px;
  transition: transform 0.3s;
}

.login-card:hover {
  transform: translateY(-5px);
}
</style>
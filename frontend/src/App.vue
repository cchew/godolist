<template>
  <v-app>
    <router-view v-slot="{ Component }">
      <v-fade-transition mode="out-in">
        <component :is="Component" />
      </v-fade-transition>
    </router-view>
  </v-app>
</template>

<script>
/**
 * Root application component
 * @component
 */
export default {
  name: 'App',
  
  /**
   * Lifecycle hook that initializes authentication
   */
  created() {
    this.$store.dispatch('auth/initAuth')
  }
}
</script>

<style>
.v-application {
  font-family: 'Inter', sans-serif !important;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
<script setup>
import { ref, computed } from 'vue';
import { useTheme } from '@/stores/theme';
import { useRouter } from 'vue-router';
import { useCredentials } from '@/stores/credentials';
const credentials = useCredentials();
const logoDark = '/logo_dark.svg';
const logoWhite = '/logo_white.svg';

const theme = useTheme();
const router = useRouter();
const userDropdownOpen = ref(false);

const buttonClass = computed(() => {
  return theme.darkMode ? 'button is-dark' : 'button is-light';
});

function toggleUserDropdown() {
  userDropdownOpen.value = !userDropdownOpen.value;
}

function logout() {
  credentials.logout();
  router.push('/login');
}

function create(){
  router.push('/create')
}

function tutorial(){
  router.push('/tutorial')
}

function favorites(){
  router.push('/favorites')
}

function search(){
  router.push('/')
}

function profile(){
  router.push('/user/'+ credentials.data.id)
}

document.body.setAttribute('data-theme', theme.darkMode ? 'dark' : 'light')
</script>

<template>
    <header :class="{ dark: theme.darkMode }">
      <div id="header-left">
<router-link to="/" class="logo-link">
      <img 
        :src="theme.darkMode ? logoDark : logoWhite" 
        alt="App Logo" 
        class="app-logo" 
      />
    </router-link>
      </div>

      <div id="header-right">
      <div v-if="credentials.token" class="buttons is-spaced">
      <button :class="buttonClass" class="button is-link" @click="create">Create</button>
      <button :class="buttonClass" class="button is-danger" @click="search">Search</button>
      <button :class="buttonClass"  class="button is-info is-light" @click="tutorial">Tutorial</button>
      <button :class="buttonClass"  class="button is-success is-light" @click="favorites">Favorites</button>
      <div class="dropdown" :class="{ 'is-active': userDropdownOpen }">
          <div class="dropdown-trigger">
            <button :class="buttonClass" 
              class="button is-warning is-light"
              @click="toggleUserDropdown"
              aria-haspopup="true"
              aria-controls="dropdown-menu"
            >
              <span>User</span>
              <span class="icon is-small">
                <i class="fas fa-angle-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu" role="menu">
            <div class="dropdown-content">
              <a class="dropdown-item" @click="profile">Your Profile</a>
              <hr class="dropdown-divider" />
              <a class="dropdown-item logout-item" @click="logout">Logout</a>
            </div>
          </div>
    </div>
      </div>

      <div>
      <button class="button dark-toggle" @click="theme.toggleDarkMode">
      <i :class="theme.darkMode ? 'fas fa-moon' : 'fas fa-sun'"></i>
      </button>
      </div>
      </div>

    </header>
</template>

<style scoped>
#header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  height: 80px;
  width: auto;
  padding-top: 10px;
}

.logo img {
  display: block;
}

.buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 20px;
}

.dark-toggle {
  background: none;
  border: none;
  box-shadow: none; 
  cursor: pointer;
  font-size: 1.2rem;
  color: #4a4a4a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown-menu {
  min-width: 100px; 
}

.logout-item {
  color: #ef233c;
}

.logout-item:hover {
  background-color: #f8d7da;
}

header.dark .logout-item:hover {
  background-color: #ffadb4;
}

</style>
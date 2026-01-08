<script setup>
import { ref, onMounted, computed } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import axios from 'axios';


const credentials = useCredentials();
const router = useRouter();
const MAX_TAGS = 3;

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

function logout() {
    credentials.logout();
    router.push('/login');
}

function create() {
    router.push('/create');
}

function addStuff() {
    router.push('/add-stuff');
}

function tutorial() {
    router.push('/tutorial');
}

function user() {
    router.push('/user/' + credentials.data.id);
}

const userDropdownOpen = ref(false)

function toggleUserDropdown() {
  userDropdownOpen.value = !userDropdownOpen.value
}

function goProfile() {
  userDropdownOpen.value = false
  router.push('/user')
}

function favorites() {
    router.push('/favorites');
}

const exercises = ref([]);
const LIMIT = 10;
const page = ref(0);
const searchQuery = ref('');

async function fetchExercises() {
  try {
    const response = await client.get('/exercises', { params: { 
      limit: LIMIT,
      offset: page.value * LIMIT
    } });
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
  }
}

async function searchExercises() {
  page.value = 0;
  if (searchQuery.value === '') {
    await fetchExercises();
    return;
  }

  try {
    const response = await client.get('/search/exercises', {
      params: { q: searchQuery.value, limit: LIMIT, offset: page.value * LIMIT }
    });
    exercises.value = response.data;
  } catch (error) {
    console.error('Error searching exercises:', error);
  }
}

onMounted(async () => {
  await fetchExercises();
});


</script>

<template>
      <header>
      <div>
        <router-link to="/" class="logo-link">
          <img src="/public/logo_white.svg" alt="App Logo" class="app-logo" />
        </router-link>
      </div>
      <div class="buttons is-spaced">
      <button class="button is-link is-light" @click="create">Create</button>
      <button class="button is-info is-light" @click="tutorial">Tutorial</button>
      <button class="button is-success is-light" @click="favorites">Favorites</button>
      <div class="dropdown" :class="{ 'is-active': userDropdownOpen }">
          <div class="dropdown-trigger">
            <button
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
              <a class="dropdown-item" @click="user">Your Profile</a>
              <hr class="dropdown-divider" />
              <a class="dropdown-item logout-item" @click="logout">Logout</a>
            </div>
          </div>
    </div>

      </div>
    </header>
    <main id="page">
    <h1>Search Page</h1>
<div class="search-container">
  <input
    type="text"
    v-model="searchQuery"
    placeholder="Search exercises..."
  />
  <button type="button" @click="searchExercises">Search</button>
</div>


    <table>
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Author</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="exercise in exercises" :key="exercise.id">
          <td><router-link
            :to="`/exercise/${exercise.id}`"
            class="exercise-link">
            {{ exercise.name }}
          </router-link>
          </td>
          <td><router-link
            :to="`/user/${exercise.user_id}`"
            class="user-link">
            {{ exercise.username }}
          </router-link></td>
          <td class="tags-cell">
            <span
              v-for="tag in exercise.tags.slice(0, MAX_TAGS)"
              :key="tag.id"
              class="tag"
            >
              {{ tag.label }}
            </span>
            <span
              v-if="exercise.tags.length > MAX_TAGS"
              class="tag more"
            >
              +{{ exercise.tags.length - MAX_TAGS }}
              <span class="tooltip">
                {{ exercise.tags
                  .slice(MAX_TAGS)
                  .map(t => t.label)
                  .join(', ') }}
              </span>
            </span>

            <span v-if="exercise.tags.length === 0">—</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button @click="page = Math.max(page - 1, 0); fetchExercises()" :disabled="page === 0">Previous</button>
      <span>Page {{ page + 1 }}</span>
      <button @click="page = page + 1; fetchExercises()" :disabled="exercises.length < LIMIT">Next</button>
    </div>
    </main>

    <footer class="app-footer">
      <p>♡ Coded with love by Aisja, 2026 ♡</p>
    </footer>

</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;       
  padding: 16px 24px;
  background: linear-gradient(90deg, #ffffff, #e6f0ff);
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-logo {
  height: 80px;
  width: auto;
  padding-left: 50px;
}


.buttons {
  display: flex;
  gap: 12px;
  padding-right: 50px;
}

.logo img {
  display: block;
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

#page {
  display: flex;
  flex-direction: column;
  align-items: center;       
  min-height: 100vh;        
  gap: 20px;                
  padding: 20px;             
  box-sizing: border-box;
}

.tags-cell {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 320px;
}

.tag {
  background: #eef1f5;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
  position: relative;
}

.tag.more {
  background: #ddd;
  cursor: default;
}

.tooltip {
  min-width: 100px;
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background: #585858;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: normal;
  max-width: 260px;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 10;
}

.tag.more:hover .tooltip {
  opacity: 1;
}
.app-footer {
  width: 100%;
  text-align: center;
  padding: 16px 0;
  background: linear-gradient(90deg, #e6f0ff, #ffffff); /* simile all'header */
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.08); /* leggero drop shadow sopra */
  font-size: 0.9rem;
  color: #2b2d42; /* colore testo leggibile */
}




</style>
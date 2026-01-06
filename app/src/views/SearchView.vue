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

const searchQuery = ref('');


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

function favorites() {
    router.push('/favorites');
}

const exercises = ref([]);

async function fetchExercises() {
  try {
    const response = await client.get('/exercises');
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
  }
}

async function searchExercises() {
  if (searchQuery.value === '') {
    await fetchExercises();
    return;
  }

  try {
    const response = await client.get('/search/exercises', {
      params: { q: searchQuery.value }
    });
    exercises.value = response.data;
  } catch (error) {
    console.error('Error searching exercises:', error);
  }
}

onMounted(async () => {
  await fetchExercises();
});


//const reversedExercises = computed(() => [...exercises.value].reverse());


</script>

<template>
    <main id="page">
    <h1>Search Page</h1>
    <fieldset>
      <legend>Menu</legend>
      <button @click="create">Create</button>
      <button @click="addStuff">Add Stuff</button>
      <button @click="favorites">Favorites</button>
      <button @click="logout">Logout</button>
    </fieldset>


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
    </main>
</template>

<style scoped>

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



</style>
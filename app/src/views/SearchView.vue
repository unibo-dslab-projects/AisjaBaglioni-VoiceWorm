<script setup>
import { ref, onMounted } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useTheme } from '@/stores/theme';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const credentials = useCredentials();
const theme = useTheme();
const MAX_TAGS = 3;

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

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

document.body.setAttribute('data-theme', theme.darkMode ? 'dark' : 'light')


onMounted(async () => {
  await fetchExercises();
});

</script>

<template>
    <Header/>
    <main id="page">
    <body>
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
    </body>
    </main>

    <Footer/>

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
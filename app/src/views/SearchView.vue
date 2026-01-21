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
document.body.setAttribute('data-theme', theme.darkMode ? 'dark' : 'light')

const exercises = ref([]);
const limit = ref(10);
const page = ref(0);
const searchQuery = ref('');

async function fetchExercises() {
  try {
    const response = await client.get('/exercises', { params: { 
      limit: limit.value,
      offset: page.value * limit.value
    } });
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
  }
}

async function resetAndSearch(){
  page.value = 0;
  await searchExercises();
}

async function searchExercises() {
  if (searchQuery.value === '') {
    await fetchExercises();
    return;
  }

  try {
    const response = await client.get('/search/exercises', {
      params: { q: searchQuery.value, limit: limit.value, offset: page.value * limit.value }
    });
    exercises.value = response.data;
  } catch (error) {
    console.error('Error searching exercises:', error);
  }
}

async function prevPage() {
  if (page.value === 0) return;
  page.value--;
  await loadExercises();
}

async function nextPage() {
  page.value++;
  await loadExercises();
}

async function loadExercises() {
  if (searchQuery.value.trim() === '') {
    await fetchExercises();
  } else {
    await searchExercises();
  }
}

function reset() {
  searchQuery.value = '';
  fetchExercises();
}

function changeLimit(event) {
  limit.value = Number(event.target.value);
  page.value = 0;
  fetchExercises();
}


onMounted(async () => {
  await fetchExercises();
});
</script>

<template>
    <Header/>
    <div class="page">

    <div class="page-title">
      <h1>Search</h1>
      <div class="title-underline"></div>
    </div>

<form @submit.prevent="resetAndSearch" class="search-container">
  <div class="help-tooltip">
    <i class="fas fa-question-circle"></i>
    <div class="tooltip-dropdown">
      You can search exercises by name, author or tags
    </div>
  </div>

  <input
    type="text"
    v-model="searchQuery"
    placeholder="Search exercises..."
    id="searchbox"
  />
  <button type="submit">Search</button>
  <button @click="reset" >Reset</button>

      <label for="limit-select">Results:</label>
       <select id="limit-select" class="limit-select" @change="changeLimit" :value="limit">
        <option :value="10">10</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
      </select>
</form>


<div class="table-wrapper">
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
              :class="['tag', tag.category]"
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
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="page === 0">Previous</button>
      <span>Page {{ page + 1 }}</span>
      <button @click="nextPage" :disabled="exercises.length < limit">Next</button>
    </div>
  </div>

    <Footer/>

</template>

<style scoped>
</style>
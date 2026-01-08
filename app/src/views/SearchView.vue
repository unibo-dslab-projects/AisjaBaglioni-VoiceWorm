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
    <main id="page">
    <body>

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
  />
  <button type="submit">Search</button>
  <button @click="reset" >Reset</button>

      <label for="limit-select">Results:</label>
       <select id="limit-select" @change="changeLimit" :value="limit">
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


.table-wrapper {
  padding-top: 20px;
  padding-bottom: 20px;
}


table {
  width: 80%;
  table-layout: fixed;
  margin: 0 auto;
  border: 2px solid #ccc;
  border-collapse: collapse;
  box-shadow: 0 4px 12px var(--shadow-color);
}

th {
  background-color: var(--table-color);
  color: var(--text-inverse);
}

th,
td {
  white-space: normal;      
  word-break: break-word;   
  overflow-wrap: anywhere; 
  border: 1px solid #ccc;
  padding: 12px 16px;
}

tbody tr:nth-child(odd) {
  background-color: var(--table-row-odd);
}

tbody tr:nth-child(even) {
  background-color: var(--table-row-even);
}

.tags-cell {
  max-width: 100%;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.exercise-link, .user-link {
  color: var(--table-color);
  display: block; 
}

.exercise-link:hover, .user-link:hover{
  color: #ff76df;
}

.tooltip {
  min-width: 100px;
  max-width: 260px;
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
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 10;
}

.tag.more:hover .tooltip {
  opacity: 1;
}

.tag {
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  position: relative;
  transition: transform 0.1s, filter 0.1s;
  margin-right: 5px;
}

.tag:hover {
  transform: translateY(-1px);
  filter: brightness(0.9);
  user-select: none;
}

.tag.more {
  background-color: #999999;
  cursor: default;
}

.page-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.page-title h1 {
  padding-top: 20px;
  font-size: 2.5rem; 
  font-weight: 300;
  margin: 0;
}

.title-underline {
  width: 250px;
  height: 2px;  
  background-color: var(--text-color); 
  border-radius: 2px;
  margin-top: 8px; 
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
}

.search-container input {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.search-container input:focus {
  outline: none;
  border-color: #6c63ff;
  box-shadow: 0 0 6px rgba(108, 99, 255, 0.3);
}

.search-container button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #6c63ff;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.help-tooltip {
  margin-left: 8px;
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 1.2rem;
}

.help-tooltip i {
  color: var(--text-color);
  font-size: 1.2rem;
}

.tooltip-dropdown {
  width: 300px;
  position: absolute;
  top: 35px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #7e7e7e;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  z-index: 10;
}

.help-tooltip:hover .tooltip-dropdown {
  opacity: 1;
  pointer-events: auto;
}

.results-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

#limit-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  cursor: pointer;
  background-color: var(--bg-color);
  color: var(--text-color);
}

</style>
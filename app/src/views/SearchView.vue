<script setup>
import { ref, onMounted } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useTheme } from '@/stores/theme';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import ExerciseTable from '@/components/ExerciseTable.vue';

import { useApiClient } from '@/composables/useApiClient';

const credentials = useCredentials();
const theme = useTheme();

const { client } = useApiClient();
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

function changeLimit(newLimit) {
  limit.value = newLimit;
  page.value = 0;
  fetchExercises();
}

async function changePage(newPage) {
  page.value = newPage;
  await loadExercises();
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


</form>


    <exercise-table
      :exercises="exercises"
      :page="page"
      :limit="limit"
      :show-author="true"
      @change-page="changePage"
      @update:limit="changeLimit"
    />
  </div>

    <Footer/>
</template>

<style scoped>
</style>
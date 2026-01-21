<script setup>
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

import ExerciseTable from '@/components/ExerciseTable.vue';

import { useApiClient } from '@/composables/useApiClient';

const limit = ref(10);
const page = ref(0);
const loading = ref(false);

const { client, withMinDelay } = useApiClient();

const exercises = ref([]);

async function fetchFavorites() {
  loading.value = true;
  try {
      const response = await withMinDelay(client.get('/favorites', { params: { 
        limit: limit.value,
        offset: page.value * limit.value
      } }));
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
  } finally {
    loading.value = false;
  }
}

async function changePage(newPage) {
  page.value = newPage;
  await fetchFavorites();
}

async function changeLimit(newLimit) {
  limit.value = newLimit;
  page.value = 0;
  await fetchFavorites();
}


onMounted(async () => {
  await fetchFavorites();
});
</script>

<template>
    <Header/>
    <div class="page">
    <div class="page-title">
      <h1>Favorites</h1>
      <div class="title-underline"></div>
    </div>
        <exercise-table
      :exercises="exercises"
      :page="page"
      :limit="limit"
      :loading="loading"
      :show-author="true"
      @change-page="changePage"
      @update:limit="changeLimit"
    />
  </div>
  <Footer/>
</template>

<style scoped>
</style>
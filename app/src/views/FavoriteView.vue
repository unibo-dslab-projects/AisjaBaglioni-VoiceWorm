<script setup>
import { ref, onMounted, computed } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

import ExerciseTable from '@/components/ExerciseTable.vue';

import { useApiClient } from '@/composables/useApiClient';

const credentials = useCredentials();
const router = useRouter();
const route = useRoute();
const limit = ref(10);
const page = ref(0);

const { client } = useApiClient();

const exercises = ref([]);

async function fetchFavorites() {
  try {
      const response = await client.get('/favorites', { params: { 
      limit: limit.value,
      offset: page.value * limit.value
    } });
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
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
      :show-author="true"
      @change-page="changePage"
      @update:limit="changeLimit"
    />
  </div>
  <Footer/>
</template>

<style scoped>
</style>
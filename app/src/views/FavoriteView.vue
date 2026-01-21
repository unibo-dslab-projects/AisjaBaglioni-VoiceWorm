<script setup>
import { ref, onMounted, computed } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const credentials = useCredentials();
const router = useRouter();
const route = useRoute();
const MAX_TAGS = 3;
const limit = ref(10);
const page = ref(0);

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

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

async function prevPage() {
  if (page.value === 0) return;
  page.value--;
  await fetchFavorites();
}

async function nextPage() {
  page.value++;
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
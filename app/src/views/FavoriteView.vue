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

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

const exercises = ref([]);

async function fetchFavorites() {
  try {
    const response = await client.get('/favorites');
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
  }
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
  </div>
  <Footer/>
</template>

<style scoped>
</style>
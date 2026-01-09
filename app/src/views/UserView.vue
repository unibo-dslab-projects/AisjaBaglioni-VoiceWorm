<script setup>
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const route = useRoute();
const credentials = useCredentials();
const router = useRouter();
const isOwner = ref(false);

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

const user_id = ref(route.params.id);
const user_info = ref(null);
const message = ref('');

const MAX_TAGS = 3;

const exercises = ref([]);

async function fetchExercises() {
  try {
    const response = await client.get(`/exercises/${user_id.value}`);
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
  }
}

async function loadUser() {
    try {
        const response = await client.get(`/user/${user_id.value}`);
        user_info.value = response.data;
    } catch (error) {
        message.value = error.response.data ?? 'Load user failed';
    }
}
onMounted(async () => {
  await loadUser();
  fetchExercises();
  isOwner.value = credentials.data.id == user_id.value;
});


</script>

<template>
  
    <Header/>
    <div id="page">

    <div class="page-title">
      <h1>{{ user_info?.username }}</h1>
      <div class="title-underline"></div>
    </div>

<table>
      <thead>
        <tr>
          <th>Exercise</th>
          <th v-if="isOwner">Visibility</th>
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
          <td v-if="isOwner && exercise.is_public">🌍 Public</td>
          <td v-else-if="isOwner">🔒 Private</td>
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

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import ExerciseForm from '@/components/ExerciseForm.vue';

const credentials = useCredentials();
const router = useRouter();
const route = useRoute();

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

const exercise_id = ref(route.params.id);
const exercise_info = ref(null);
const isOwner = ref(false);
const message = ref('');
const delete_message = ref('');
const favorites_message = ref('');
const is_favorite = ref(false);
const allTags = ref([]);

async function loadExercise() {
    try {
        const response = await client.get(`/exercise/${exercise_id.value}`);
        exercise_info.value = response.data;
        isOwner.value = credentials.data.id == exercise_info.value.user_id;
    } catch (error) {
        message.value = error?.response?.data ?? 'Load exercise failed';
        console.error('Load exercise error:', error);
    }
}

async function isFavorite() {
    try {
        const response = await client.get(`/favorites/check/${exercise_id.value}`);
        return response.data.is_favorite;
    } catch (error) {
        console.error('Is favorite error:', error);
        return false;
    }
}

async function toggleFavorite() {
    try {
        if (is_favorite.value) {
            const response = await client.delete(`/favorites/${exercise_id.value}`);
            favorites_message.value = response.data.message;
            is_favorite.value = false;
        } else {
            const response = await client.post(`/favorites/${exercise_id.value}`);
            favorites_message.value = response.data.message;
            is_favorite.value = true;
        }
    } catch (error) {
        favorites_message.value = error?.response?.data ?? 'Favorite action failed';
        console.error('Favorite action error:', error);
    }
}

async function modifyExercise(data) {
    try {
        await client.put(`/exercise/${exercise_id.value}`, {
            name: data.name,
            abc: data.abc,
            is_public: data.is_public,
            bpm: data.bpm,
            a_steps: data.a_steps,
            d_steps: data.d_steps,
            s_note: data.s_note,
            h_note: data.h_note,
            l_note: data.l_note,
            tag_ids: data.tag_ids
        });
        message.value = "Exercise updated successfully!";
        // Reload to ensure sync
        await loadExercise();
    } catch (error) {
        message.value = error?.response?.data ?? 'Modify exercise failed';
        console.error('Modify exercise error:', error);
    }
    delete_message.value = '';
}

async function deleteExercise(){
  const confirmed = window.confirm("Are you sure you want to delete your exercise?");
  
  if (!confirmed) return;

  try {
        const response = await client.delete(`/exercise/${exercise_id.value}`);
        delete_message.value = response.data.message;
        router.push('/user/'+ credentials.data.id)
    } catch (error) {
        delete_message.value = error?.response?.data ?? 'Delete exercise failed';
        console.error('Delete exercise error:', error);
  }
  message.value = '';
}

async function fetchTags() {
  try {
    const response = await client.get('/tags');
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error?.response || error);
    return [];
  }
}

onMounted(async () => {
    allTags.value = await fetchTags();
    await loadExercise();
    if (exercise_info.value) {
        is_favorite.value = await isFavorite();
    }
});

watch(
    () => route.params.id,
    async (new_id) => {
        exercise_info.value = null;
        exercise_id.value = new_id;
        await loadExercise();
        if (exercise_info.value) {
            is_favorite.value = await isFavorite();
       }
    }
);
</script>

<template>
    <Header/>
    <div class="page">
      <ExerciseForm 
        v-if="exercise_info"
        mode="edit" 
        :initial-data="exercise_info"
        :is-owner="isOwner"
        :all-tags="allTags"
        :message="message"
        :delete-message="delete_message"
        :favorites-message="favorites_message"
        :is-favorite="is_favorite"
        @save="modifyExercise"
        @delete="deleteExercise"
        @toggle-favorite="toggleFavorite"
      />
      <div v-else>Loading...</div>
    </div>
    <Footer/>
</template>

<style scoped>
</style>
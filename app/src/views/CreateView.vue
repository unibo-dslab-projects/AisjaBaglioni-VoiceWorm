
<script setup>
import { onMounted, ref } from 'vue';
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import ExerciseForm from '@/components/ExerciseForm.vue';

const credentials = useCredentials();
const router = useRouter();

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${credentials.token}`
    }
});

const message = ref('');
const allTags = ref([]);

async function submitExercise(data) {
  try {
    await client.post('/exercises', { // Using submitted data structure
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
    router.push('/');
  } catch (error) {
    message.value = error?.response?.data ?? 'Submit exercise failed';
    console.error('Submit exercise error:', error);
  }
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
});
</script>

<template>
    <Header/>
    <div class="page">
      <ExerciseForm 
        mode="create" 
        :all-tags="allTags"
        :message="message"
        @save="submitExercise"
      />
    </div>
    <Footer/>
</template>

<style scoped>
</style>
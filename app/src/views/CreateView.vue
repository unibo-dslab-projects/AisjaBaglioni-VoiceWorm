
<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import ExerciseForm from '@/components/ExerciseForm.vue';
import { useApiClient } from '@/composables/useApiClient';

const router = useRouter();

const { client, withMinDelay } = useApiClient();

const message = ref('');
const allTags = ref([]);
const loading = ref(true);

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
   loading.value = true;
   allTags.value = await withMinDelay(fetchTags());
   loading.value = false;
});
</script>

<template>
    <Header/>
    <div class="page">
      <ExerciseForm
        v-if="!loading"
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
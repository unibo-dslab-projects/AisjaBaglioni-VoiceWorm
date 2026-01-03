<script setup>
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import axios from 'axios';


const credentials = useCredentials();
const router = useRouter();

const tagLabel = ref('');
const tagCategory = ref('');

const message = ref('');

async function addTag() {
try {
  const response = await axios.post(import.meta.env.VITE_API_BASE_URL + '/tags', {
    category: tagCategory.value,
    label: tagLabel.value
});

tagLabel.value = '';
tagCategory.value = '';

message.value = response.data.message;
  } catch (error) {
    message.value = error.response.data ?? 'Add tag failed';
  }
}

</script>

<template>
<main>
<h1>Add Stuff</h1>

<fieldset>
  <legend>Add New Tag</legend>
  <input v-model="tagCategory" placeholder="Category" />
  <input v-model="tagLabel" placeholder="Tag label" />
  <button type="button" @click="addTag">Add Label</button>
</fieldset>

</main>
</template>

<style scoped>
</style>
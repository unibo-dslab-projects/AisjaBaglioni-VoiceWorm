<script setup>
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

import { useApiClient } from '@/composables/useApiClient';
import { useCredentials } from '@/stores/credentials';

const route = useRoute();
const router = useRouter();
const isOwner = ref(false);
const credentials = useCredentials();
const { client, withMinDelay } = useApiClient();

const user_id = ref(route.params.id);
const user_info = ref(null);
const message = ref('');
const changeMessage = ref('');
const deleteMessage = ref('');



import ExerciseTable from '@/components/ExerciseTable.vue';

const exercises = ref([]);
const page = ref(0);
const limit = ref(10);
const loading = ref(false);

const oldPassword = ref('')
const newPassword = ref('')


async function fetchExercises() {
  loading.value = true;
  try {
    const response = await withMinDelay(client.get(`/exercises/${user_id.value}`, {
      params: {
        limit: limit.value,
        offset: page.value * limit.value
      }
    }));
    exercises.value = response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
  } finally {
    loading.value = false;
  }
}

async function changePage(newPage) {
  page.value = newPage;
  await fetchExercises();
}

async function changeLimit(newLimit) {
  limit.value = newLimit;
  page.value = 0;
  await fetchExercises();
}

async function loadUser() {
    try {
        const response = await client.get(`/user/${user_id.value}`);
        user_info.value = response.data;
    } catch (error) {
        message.value = error.response.data ?? 'Load user failed';
    }
}

function isPasswordValid(pwd) {
  return /^(?=.*[A-Z])(?=.*\d).{8,64}$/.test(pwd);
}

async function changePassword() {
  changeMessage.value = ''

  if (!oldPassword.value || !newPassword.value) {
    changeMessage.value = 'Fill all fields'
    return
  }

if (!isPasswordValid(newPassword.value)) {
    changeMessage.value =
      'Password must be at least 8 characters long and contain at least one uppercase letter and one number';
    return;
  }

  if (newPassword.value == oldPassword.value) {
    changeMessage.value = 'The new password must be different from the old one'
    return
  }
  
  try {
    const response = await client.put('/user/me/password', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })

    changeMessage.value = response.data.message
    oldPassword.value = ''
    newPassword.value = ''
  } catch (error) {
    changeMessage.value =
      error.response?.data ?? 'Password change failed'
  }
}



async function deleteAccount() {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
  
    if (!confirmed) return;
 try {
        const response = await client.delete(`/user/me`);
        deleteMessage.value =  response.data.message;
        router.push("/login")
    } catch (error) {
        deleteMessage.value = error.response.data ?? 'Delete user failed';
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
    <div class="page">

    <div class="page-title">
      <h1>{{ user_info?.username }}</h1>
      <div class="title-underline"></div>
    </div>

    <exercise-table
      :exercises="exercises"
      :page="page"
      :limit="limit"
      :loading="loading"
      :is-owner="isOwner"
      :show-visibility="true"
      @change-page="changePage"
      @update:limit="changeLimit"
    />

<div v-if="isOwner" class="form-section" id="danger-zone">
  <h2 class="form-label danger-text" >Account Settings</h2>
  
  <div class="danger-controls">
    <div class="change-password-box">
      <p style="margin-bottom: 8px; font-size: 0.9rem; opacity: 0.8;">Change your account password:</p>
      <input type="password" placeholder="Current password" v-model="oldPassword" id="oldPassword"/>
      <input type="password" placeholder="New password" v-model="newPassword" id="newPassword"/>
      <button class="danger-button outline" @click="changePassword">Change Password</button>
      <div v-if="changeMessage" class="modify-message">{{ changeMessage }}</div>
    </div>

    <div style="order: 2;">
      <p style="margin-bottom: 8px; font-size: 0.9rem; opacity: 0.8;">Permanently remove your account and data:</p>
      <button id="delete-button" class="danger-button" @click="deleteAccount">Delete Account</button>
      <div v-if="deleteMessage" class="delete-message">{{ deleteMessage }}</div>
    </div>
  </div>
</div>

  </div>

  <Footer/>
</template>

<style scoped>

.danger-text {
  color: var(--danger-text);
}

.danger-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.change-password-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px;
}

.change-password-box input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #ccc);
  background-color: var(--input-bg, transparent);
  color: var(--text-color);
  width: 100%;
}

.change-password-box input:focus {
  outline: none;
}

.change-password-box button {
  width: fit-content;
  align-self: flex-start;
}

.modify-message {
  font-size: 0.9rem;
}

.delete-message {
  color: var(--danger-text);
  font-size: 0.9rem;
}

</style>
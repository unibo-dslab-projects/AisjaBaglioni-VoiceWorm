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
const changeMessage = ref('');
const deleteMessage = ref('');

const MAX_TAGS = 3;

const exercises = ref([]);

const oldPassword = ref('')
const newPassword = ref('')


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

async function changePassword() {
  changeMessage.value = ''

  if (!oldPassword.value || !newPassword.value) {
    changeMessage.value = 'Fill all fields'
    return
  }

  if (newPassword.value.length < 8) {
    changeMessage.value = 'Password must be at least 8 characters'
    return
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

<div v-if="isOwner" class="form-section" id="danger-zone">
  <label class="form-label" id="danger-text">Account Settings</label>
  
  <div class="danger-controls">
    <div class="change-password-box">
      <p style="margin-bottom: 8px; font-size: 0.9rem; opacity: 0.8;">Change your account password:</p>
      <input type="password" placeholder="Current password" v-model="oldPassword" />
      <input type="password" placeholder="New password" v-model="newPassword" />
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

#danger-text {
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
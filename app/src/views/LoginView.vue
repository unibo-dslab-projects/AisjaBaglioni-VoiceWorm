<script setup>
import { useCredentials } from '@/stores/credentials';
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const credentials = useCredentials();

const email = ref('');
const password = ref('');
const message = ref('');

async function handleLogin() {
  let status = false;
  let token = null;

  try {
    const response = await axios.post(import.meta.env.VITE_API_BASE_URL + '/login', {
      email: email.value,
      password: password.value
  });
    status = response.status == 200;
    message.value = response.data.message;
    token = response.data;
} catch (error) {
status = false;
    message.value = error.response.data ?? 'Login failed';
    console.error('Login error:', error);
  }

  if (status) {
    credentials.login(token);
    router.push('/');
  } 

}
</script>

<template>
  <div id="page">
    <h1>Accedi a VoiceWorm</h1>

    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>

      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <button type="submit">Accedi</button>
    </form>

    <div>
      <p id="errormessage">{{ message }}</p>
    </div>

    <p>
      Non hai un account?
      <router-link to="/register">Registrati</router-link>
    </p>
  </div>
</template>

<style scoped>
#errormessage {
  color: red;
}

#page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;  
}
</style>

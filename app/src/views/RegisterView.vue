<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('');
const password = ref('');
const username = ref('');
const message = ref('');

async function handleRegister() {
let status = false;

try {
  const response = await axios.post(import.meta.env.VITE_API_BASE_URL + '/register', {
    email: email.value,
    password: password.value,
    username: username.value,
    secret: "1OXQWwIRxkHAzz173tn1bezp"
    });
    status = response.status == 200;
    message.value = response.data.message;
  } catch (error) {
    status = false;
    message.value = error.response.data ?? 'Registration failed';
    console.error('Registration error:', error);
  }

  if (status) {
    router.push('/login');
  } 
}
</script>

<template>
  <div id="page">
    <h1>Registrati a VoiceWorm</h1>

    <form @submit.prevent="handleRegister">
        
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>

      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="username" required />
      </div>

      <button type="submit">Registrati</button>
    </form>

    <div>
      <p id="errormessage">{{ message }}</p>
    </div>

    <p>
      Hai già un account?
      <router-link to="/login">Accedi</router-link>
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

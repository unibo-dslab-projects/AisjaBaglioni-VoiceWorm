<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

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
  <Header/>
  <div class="page">
      <div class="page-title">
      <h1>Create an account</h1>
      <div class="title-underline"></div>
    </div>

    <form class="access-form" @submit.prevent="handleRegister">
        
      <div>
        <label for="email">E-mail:</label>
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
      <p class="errormessage">{{ message }}</p>
    </div>

    <p class="switchto">
      Already registered?
      <router-link to="/login">Sign in</router-link>
    </p>
  </div>
  <Footer/>
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

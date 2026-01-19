<script setup>
import { useCredentials } from '@/stores/credentials';
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

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
  <Header/>
  <div class="page">
    <div class="page-title">
      <h1>Sign in to VoiceWorm</h1>
      <div class="title-underline"></div>
    </div>


    <form class="access-form" @submit.prevent="handleLogin">
      <div>
        <label for="email">E-mail:</label>
        <input type="email" id="email" v-model="email" required autocomplete="on"/>
      </div>

      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>

      <button type="submit">Log in</button>
    </form>

    <div>
      <p class="errormessage">{{ message }}</p>
    </div>

    <p class="switchto">
      Don't have an account?
      <router-link to="/register">Sign up</router-link>
    </p>
  </div>
  <Footer/>
</template>

<style scoped>
</style>

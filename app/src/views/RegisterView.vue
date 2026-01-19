<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const router = useRouter();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const username = ref('');
const message = ref('');


function isPasswordValid(pwd) {
  return /^(?=.*[A-Z])(?=.*\d).{8,64}$/.test(pwd);
}

async function handleRegister() {
message.value = '';
let status = false;
if (username.value.length < 3 || username.value.length > 20) {
  message.value = 'Username must be between 3 and 20 characters';
  return;
}

if (!isPasswordValid(password.value)) {
    message.value =
      'Password must be at least 8 characters long and contain at least one uppercase letter and one number';
    return;
  }

if (password.value !== confirmPassword.value) {
  message.value = 'Passwords do not match';
  return;
}

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
        <input type="email" id="email" v-model="email" required autocomplete="off"/>
      </div>

      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" placeholder="At least 8 chars, 1 uppercase, 1 number" required />

      </div>

      <div>
        <label for="confirmPassword">Repeat password:</label>
        <input id="confirmPassword" type="password" v-model="confirmPassword" placeholder="Repeat your password" required />
      </div>

      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="username" placeholder="At least 3 chars" required autocomplete="off"/>
      </div>

      <button type="submit">Sign up</button>
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

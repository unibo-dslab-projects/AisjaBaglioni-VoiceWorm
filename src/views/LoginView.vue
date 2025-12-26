<script setup>
console.log("Login loaded");
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

    <p>
      Non hai un account?
      <router-link to="/register">Registrati</router-link>
    </p>
  </div>
</template>

<style scoped>

#page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;  
}
</style>

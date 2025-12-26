<script setup>
console.log("Register loaded");
</script>

<template>
  <div id="page">
    <h1>Registrati a VoiceWorm</h1>

    <form @submit.prevent="handleLogin">
        
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

    <p>
      Hai già un account?
      <router-link to="/login">Accedi</router-link>
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

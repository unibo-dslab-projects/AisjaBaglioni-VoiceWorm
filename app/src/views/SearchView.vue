<script setup>
import { useCredentials } from '@/stores/credentials';
import { useRouter } from 'vue-router';

const credentials = useCredentials();
const router = useRouter();

function logout() {
    console.log("Logging out");
    credentials.logout();
    router.push('/login');
}
</script>

<template>
    <main>Search Page</main>
    <button @click="logout">Logout</button>
</template>
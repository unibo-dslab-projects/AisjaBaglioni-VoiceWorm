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

function create() {
    router.push('/create');
}

function addStuff() {
    router.push('/add-stuff');
}

</script>

<template>
    <main>Search Page</main>
    <button @click="create">Create</button>
    <button @click="addStuff">Add Stuff</button>
    <button @click="logout">Logout</button>
</template>
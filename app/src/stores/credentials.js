import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export const useCredentials = defineStore("credentials", {
    state: () => ({
        token: useLocalStorage("token", null),
    }),
    getters: {
        isTokenPresent: (state) => {
            return state.token !== null;
        },
        data: (state) => {
            if (state.isTokenPresent) {
                try {
                    const payload = state.token.split(".")[1];
                    return JSON.parse(atob(payload));
                }
                catch (e) {
                    console.error("Error decoding token", e);
                    return null;
                }
            }
        },
        isAuthenticated: (state) => {
            return state.isTokenPresent && state.data.exp > Date.now() / 1000;
        },
    },
    actions: {
        login(token) {
            this.token = token;
        },
        logout() {
            this.token = null;
        }
    }
})
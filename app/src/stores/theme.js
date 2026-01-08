import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";

export const useTheme = defineStore("theme", {
    state: () => ({
        darkMode: useLocalStorage("darkMode", false),
    }),
    getters: {
        isDarkMode: (state) => {
            return state.darkMode;
        },
    },
    actions: {
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        }
    }
})
import 'abcjs/abcjs-audio.css';
import 'bulma/css/bulma.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@/assets/style.scss';

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')


import axios from 'axios';
import { useCredentials } from '@/stores/credentials';

export function useApiClient() {
    const credentials = useCredentials();

    const client = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL
    });

    client.interceptors.request.use((config) => {
        if (credentials.token) {
            config.headers.Authorization = `Bearer ${credentials.token}`;
        }
        return config;
    });

    async function withMinDelay(promise, ms = 100) {
        return Promise.all([
            promise,
            new Promise(resolve => setTimeout(resolve, ms))
        ]).then(([result]) => result);
    }

    return { client, withMinDelay };
}

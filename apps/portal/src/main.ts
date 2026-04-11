import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';

// Suppress webpack "Automatic publicPath" warning from CDN bundles (redoc, etc.)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const msg = args[0]?.toString?.() ?? '';
  if (msg.includes('Automatic publicPath') || msg.includes('Unknown')) return;
  originalConsoleError.apply(console, args);
};

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');

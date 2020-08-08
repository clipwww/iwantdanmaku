import { createApp } from 'vue/dist/vue.esm-bundler.js';
// @ts-ignore
import App from './view/index';

createApp({
  template: require('./view/template.html'),
  ...App
}).mount('#app')
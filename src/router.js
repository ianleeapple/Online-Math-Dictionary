import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import ProfileView from './views/ProfileView.vue';
import QuizCreateView from './views/QuizCreateView.vue';
import QuizRecordView from './views/QuizRecordView.vue';
import ClassGroupView from './views/ClassGroupView.vue';
import LoginView from './views/LoginView.vue';
import RegisterView from './views/RegisterView.vue';

import AITestView from './views/AITestView.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  { path: '/quiz/create', name: 'QuizCreate', component: QuizCreateView },
  { path: '/quiz/records', name: 'QuizRecord', component: QuizRecordView },
  { path: '/class-group', name: 'ClassGroup', component: ClassGroupView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/ai-test', name: 'AITest', component: AITestView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

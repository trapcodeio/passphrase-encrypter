import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Index from "./views/Index.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "encrypt",
    component: Index
    // component: () => import("./views/Index.vue")
  },
  {
    path: "/decrypt",
    name: "decrypt",
    component: () => import("./views/Decrypt.vue")
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;

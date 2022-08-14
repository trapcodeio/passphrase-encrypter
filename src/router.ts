import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
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
  history: createWebHashHistory(),
  routes
});

export default router;

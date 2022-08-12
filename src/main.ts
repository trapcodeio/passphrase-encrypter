import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./tailwind.css";
import "./assets/scss/app.scss";

const app = createApp(App);

// import Components
import LoadingButton from "revue-components/vues/LoadingButton.vue";
import Debug from "revue-components/vues/Debug.vue";

// Register Components
app.component("LoadingButton", LoadingButton);
app.component("Debug", Debug);

app.use(router);
app.mount("#app");

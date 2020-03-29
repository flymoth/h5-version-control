import Vue from "vue";
import Router from "@souche-vue/souche-router";
import routes from "./modules";
import versionControl from "@/utils/versionControl";

const versionMatch = navigator.userAgent.match(/AppVersion\/((\d|\.)*)/);

let versionControlInstance = versionMatch
    ? versionControl.init(versionMatch[1])
    : null;

// let versionControlInstance = versionControl.init("1.3.0");
Vue.use(Router);

const router = new Router({
    base: "/",
    routes: versionControlInstance
        ? versionControlInstance.parse(routes)
        : routes
});

//其他常规代码...


export default router;

import { Router } from "../deps.js";
import { hello } from "./controllers/healthController.js";
import * as healthApi from "./apis/healthApi.js";

const router = new Router();

router.get('/', hello);
router.get('/auth/registration', healthApi.register);
router.post('/auth/login', healthApi.login);
router.post('/auth/logout', healthApi.logout);
router.get('/behavior/reporting', healthApi.reporting);

export { router };
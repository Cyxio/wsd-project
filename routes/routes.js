import { Router } from "../deps.js";
import * as healthController from "./controllers/healthController.js";
import * as healthApi from "./apis/healthApi.js";

const router = new Router();

router.get('/', healthController.hello);

router.get('/auth/login', healthController.loginForm);
router.post('/auth/login', healthController.postLoginform);

router.get('/auth/registration', healthController.registerForm);
router.post('/auth/registration', healthController.postRegisterform);

router.get('/auth/logout', healthController.logout);

router.get('/behavior/reporting', healthController.reporting);
router.get('/behavior/reporting/morning', healthController.morningReport);
router.get('/behavior/reporting/evening', healthController.eveningReport);
// router.get('/auth/registration', healthApi.register);
// router.post('/auth/login', healthApi.login);
// router.post('/auth/logout', healthApi.logout);
// router.get('/behavior/reporting', healthApi.reporting);

export { router };
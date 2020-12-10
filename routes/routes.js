import { Router } from "../deps.js";
import * as healthController from "./controllers/healthController.js";
import * as healthApi from "./apis/healthApi.js";

const router = new Router();

router.get('/', healthController.landing);

router.get('/auth/login', healthController.loginForm);
router.post('/auth/login', healthController.postLoginform);

router.get('/auth/registration', healthController.registerForm);
router.post('/auth/registration', healthController.postRegisterform);

router.get('/auth/logout', healthController.logout);

router.get('/behavior/reporting', healthController.reporting);
router.get('/behavior/reporting/morning', healthController.morningReport);
router.post('/behavior/reporting/morning', healthController.postMorningReport);
router.get('/behavior/reporting/evening', healthController.eveningReport);
router.post('/behavior/reporting/evening', healthController.postEveningReport);
router.get('/behavior/summary', healthController.summary);
router.post('/behavior/summary', healthController.postSummary);

router.get('/api/summary', healthApi.weekSummary);
router.get('/api/summary/:year/:month/:day', healthApi.daySummary);

export { router };
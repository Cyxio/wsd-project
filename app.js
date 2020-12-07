import { Application, Session } from "./deps.js";
import { router } from "./routes/routes.js";
import * as middleware from './middlewares/middlewares.js';
import { viewEngine, engineFactory, adapterFactory } from "./deps.js";

const app = new Application();

const ejsEngine = engineFactory.getEjsEngine();
const oakAdapter = adapterFactory.getOakAdapter();
app.use(viewEngine(oakAdapter, ejsEngine, {
    viewRoot: "./views"
}));

const session = new Session({ framework: "oak" });
await session.init();

app.use(session.use()(session, { maxAge: 60*60*24*7 } ));

app.use(middleware.errorMiddleware);
app.use(middleware.authenticationMiddleware);
app.use(middleware.serveStaticFilesMiddleware);

app.use(router.routes());

if (!Deno.env.get('TEST_ENVIRONMENT')) {
    app.listen({ port: 7777 });
  }
    
  export default app;
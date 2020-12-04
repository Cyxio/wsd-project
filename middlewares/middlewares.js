import { send } from '../deps.js';

const errorMiddleware = async(context, next) => {
  try {
    await next();
  } catch (e) {
    console.log(e);
  }
}

const authenticationMiddleware = async({request, response, session}, next) => {
  if (request.url.pathname.startsWith('/admin')) {
    if (session && await session.get('authenticated')) {
      await next();
    } else {
      response.status = 401;
    }
  } else {
    await next();
  }
}

const serveStaticFilesMiddleware = async(context, next) => {
  if (context.request.url.pathname.startsWith('/static')) {
    const path = context.request.url.pathname.substring(7);
  
    await send(context, path, {
      root: `${Deno.cwd()}/static`
    });
  
  } else {
    await next();
  }
}

export { errorMiddleware, authenticationMiddleware, serveStaticFilesMiddleware };
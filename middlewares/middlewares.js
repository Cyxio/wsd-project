import { send } from '../deps.js';

const errorMiddleware = async(context, next) => {
  try {
    await next();
  } catch (e) {
    console.log(e);
  }
}

const authenticationMiddleware = async({request, response, session}, next) => {
  let id = "anonymous";
  const user = await session.get('user');
  if(user){
    id = user.id;
  }
  const pname = request.url.pathname;
  console.log(`Time: ${new Date().toISOString()} method: ${request.method} path: ${pname} id: ${id}`);
  if (pname === '/' || pname.startsWith('/api') || pname.startsWith('/auth') || pname.startsWith('/static')) {
    await next();
  } else {
    if (session && await session.get('authenticated')) {
      await next();
    } else {
      response.redirect("/auth/login");
    }
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
import * as healthService from "../../services/healthService.js";

const hello = async({render, session}) => {
  render('landingPage.ejs', { loggedAs: await healthService.isLoggedIn(session) });
}

const reporting = async({render, session}) => {
  render('reporting.ejs', { loggedAs: await healthService.isLoggedIn(session) });
}

const morningReport = async({render, session}) => {
  render('morningReport.ejs', { dateToday: new Date().toISOString().substr(0, 10), loggedAs: await healthService.isLoggedIn(session) } )
}

const eveningReport = async({render, session}) => {
  render('eveningReport.ejs', { dateToday: new Date().toISOString().substr(0, 10), loggedAs: await healthService.isLoggedIn(session) } )
}

const loginForm = async({render, session}) => {
  render('loginForm.ejs', { error: '', loggedAs: await healthService.isLoggedIn(session) });
}

const postLoginform = async({request, response, session, render}) => {
  const error = await healthService.authenticate({request: request, session: session});
  if (error === 'Authentication successful!'){
    response.redirect('/behavior/reporting');
  }
  else {
    render('loginForm.ejs', { error: error, loggedAs: await healthService.isLoggedIn(session) } );
  }
}

const registerForm = async({render, session}) => {
  render('registerForm.ejs', { error: '', loggedAs: await healthService.isLoggedIn(session) });
}

const postRegisterform = async({request, response, session, render}) => {
  const error = await healthService.register({request: request, session: session});
  if (error === 'Registration successful!'){
    response.redirect('/');
  }
  else {
    render('registerForm.ejs', { error: error, loggedAs: await healthService.isLoggedIn(session) } );
  }
}

const logout = async({response, session}) => {
  await session.set('authenticated', null);
  await session.set('user', null);
  response.redirect('/');
}

 
export { hello, reporting, morningReport, eveningReport, loginForm, postLoginform, registerForm, postRegisterform, logout };
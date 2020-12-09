import * as healthService from "../../services/healthService.js";
import { validate, required, numberBetween, isNumeric, isEmail, minNumber, isNumber, isInt, isDate, minLength, match } from "../../deps.js";

const hello = async({render, session}) => {
  render('landingPage.ejs', { loggedAs: await healthService.isLoggedIn(session) });
}

const reporting = async({render, session}) => {
  render('reporting.ejs', { loggedAs: await healthService.isLoggedIn(session) });
}

const morningReport = async({render, session}) => {
  render('morningReport.ejs', { dateToday: new Date().toISOString().substr(0, 10), loggedAs: await healthService.isLoggedIn(session), errors: [] } )
}

const eveningReport = async({render, session}) => {
  render('eveningReport.ejs', { dateToday: new Date().toISOString().substr(0, 10), loggedAs: await healthService.isLoggedIn(session), errors: [] } )
}

const loginForm = async({render, session}) => {
  render('loginForm.ejs', { errors: [], loggedAs: await healthService.isLoggedIn(session) });
}

const postLoginform = async({request, response, session, render}) => {
  const [passes, errors] = await healthService.authenticate({request: request, session: session});
  if (passes){
    response.redirect('/behavior/reporting');
  }
  else {
    render('loginForm.ejs', { errors: errors, loggedAs: await healthService.isLoggedIn(session) } );
  }
}

const registerForm = async({render, session}) => {
  render('registerForm.ejs', { errors: [], loggedAs: await healthService.isLoggedIn(session) });
}

const postRegisterform = async({request, response, session, render}) => {
  const [passes, errors] = await healthService.register({request: request, session: session});
  if (passes){
    response.redirect('/');
  }
  else {
    render('registerForm.ejs', { errors: errors, loggedAs: await healthService.isLoggedIn(session) } );
  }
}

const logout = async({response, session}) => {
  await session.set('authenticated', null);
  await session.set('user', null);
  response.redirect('/');
}

const postMorningReport = async({request, response, render, session}) => {
  const body = request.body();
  const params = await body.value;
  const date = params.get('date');
  const sleep_duration = Number(params.get('sleep_duration'));
  const sleep_quality = Number(params.get('sleep_quality'));
  const mood = Number(params.get('mood'));

  const user = await session.get('user');
  if(!user){
    response.redirect('/auth/login');
    return;
  }
  const user_id = user.id;

  const validationRules = {
    Date: [required, isDate],
    Sleep_duration: [required],
    Sleep_amount: [isNumeric, numberBetween(0, 24)],
    Sleep_quality: [required],
    General_mood: [required]
  }

  const [passes, errors] = await validate({
    Date: date, 
    Sleep_duration: params.get('sleep_duration'), 
    Sleep_amount: sleep_duration,
    Sleep_quality: params.get('sleep_quality'), 
    General_mood: params.get('mood')
  }, validationRules);

  if (!passes) {
    render('morningReport.ejs', { dateToday: new Date().toISOString().substr(0, 10), loggedAs: await healthService.isLoggedIn(session), errors: errors});
    return;
  }

  const prev = await healthService.checkMorning(date, user_id);
  if(prev.length === 0){
    await healthService.addMorning(date, sleep_duration, sleep_quality, mood, user_id);
  } else {
    await healthService.updateMorning(date, sleep_duration, sleep_quality, mood, user_id);
  }
  response.redirect('/');
}

 
export { hello, reporting, morningReport, eveningReport, loginForm, postLoginform, registerForm, postRegisterform, logout, postMorningReport };
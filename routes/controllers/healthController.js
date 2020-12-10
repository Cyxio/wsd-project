import * as healthService from "../../services/healthService.js";
import { validate, required, numberBetween, isNumeric, isEmail, minNumber, isNumber, isInt, isDate, minLength, match } from "../../deps.js";

const landing = async({render, session}) => {
  let moods = null;
  let day = new Date();
  const t = await healthService.overallMood(day);
  day.setDate(day.getDate() - 1);
  const y = await healthService.overallMood(day);
  if (t > 0 && y > 0){
    moods = {
      message: (y > t) ? 'Things are looking a bit gloomy today, keep your head up!' : 'Things seem to be looking brighter today!',
      yesterday: y,
      today: t
    };
  }
  render('landingPage.ejs', { loggedAs: await healthService.isLoggedIn(session), moods: moods });
}

const reporting = async({render, session}) => {
  const completed = await healthService.reportsComplete(new Date().toISOString().substr(0, 10), (await session.get('user')).id )
  render('reporting.ejs', { loggedAs: await healthService.isLoggedIn(session), confirmation: '', completed: completed });
}

const morningReport = async({render, session}) => {
  render('morningReport.ejs', { 
    dateToday: new Date().toISOString().substr(0, 10), 
    loggedAs: await healthService.isLoggedIn(session), 
    errors: [],
    populated: [''] } )
}

const eveningReport = async({render, session}) => {
  render('eveningReport.ejs', { 
    dateToday: new Date().toISOString().substr(0, 10), 
    loggedAs: await healthService.isLoggedIn(session), 
    errors: [],
    populated: ['', ''] } )
}

const loginForm = async({render, session}) => {
  render('loginForm.ejs', { errors: [], loggedAs: await healthService.isLoggedIn(session) });
}

const postLoginform = async({request, response, session, render}) => {
  const body = request.body();
  const params = await body.value;
  const email = params.get('email');
  const password = params.get('password');
  const [passes, errors] = await healthService.authenticate(email, password, session);
  if (passes){
    response.redirect('/');
  }
  else {
    render('loginForm.ejs', { errors: errors, loggedAs: await healthService.isLoggedIn(session) } );
  }
}

const registerForm = async({render, session}) => {
  render('registerForm.ejs', { email: '', errors: [], loggedAs: await healthService.isLoggedIn(session) });
}

const postRegisterform = async({request, response, session, render}) => {
  const [passes, errors] = await healthService.register({request: request, session: session});
  if (passes){
    response.redirect('/');
  }
  else {
    const body = request.body();
    const params = await body.value;
    const email = params.get('email');
    render('registerForm.ejs', { email: email, errors: errors, loggedAs: await healthService.isLoggedIn(session) } );
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
    Generic_mood: [required]
  }

  const [passes, errors] = await validate({
    Date: date, 
    Sleep_duration: params.get('sleep_duration'), 
    Sleep_amount: sleep_duration,
    Sleep_quality: params.get('sleep_quality'), 
    Generic_mood: params.get('mood')
  }, validationRules);

  if (!passes) {
    render('morningReport.ejs', { 
      dateToday: date, 
      loggedAs: await healthService.isLoggedIn(session), 
      errors: errors,
      populated: [params.get('sleep_duration'), `sleep${sleep_quality}`, `mood${mood}`]});
    return;
  }

  let confirmation = `Morning report for ${date} `;
  const prev = await healthService.checkMorning(date, user_id);
  if(prev.length === 0){
    await healthService.addMorning(date, sleep_duration, sleep_quality, mood, user_id);
    confirmation += 'submitted!';
  } else {
    await healthService.updateMorning(date, sleep_duration, sleep_quality, mood, user_id);
    confirmation += 'updated!';
  }
  const completed = await healthService.reportsComplete(new Date().toISOString().substr(0, 10), (await session.get('user')).id )
  render('reporting.ejs', { loggedAs: await healthService.isLoggedIn(session), confirmation: confirmation, completed: completed });
}

const postEveningReport = async({request, response, render, session}) => {
  const body = request.body();
  const params = await body.value;
  const date = params.get('date');
  const sport_time = Number(params.get('sport_time'));
  const study_time = Number(params.get('study_time'));
  const eating = Number(params.get('eating'));
  const mood = Number(params.get('mood'));

  const user = await session.get('user');
  if(!user){
    response.redirect('/auth/login');
    return;
  }
  const user_id = user.id;

  const validationRules = {
    Date: [required, isDate],
    Sport_time: [required],
    Sport_amount: [isNumeric, numberBetween(0, 24)],
    Study_time: [required],
    Study_amount: [isNumeric, numberBetween(0, 24)],
    Eating: [required],
    Generic_mood: [required]
  }

  const [passes, errors] = await validate({
    Date: date, 
    Sport_time: params.get('sport_time'), 
    Sport_amount: sport_time,
    Study_time: params.get('study_time'), 
    Study_amount: study_time,
    Eating: params.get('eating'),
    Generic_mood: params.get('mood')
  }, validationRules);

  if (!passes) {
    render('eveningReport.ejs', { 
      dateToday: date, 
      loggedAs: await healthService.isLoggedIn(session), 
      errors: errors,
      populated: [params.get('sport_time'), params.get('study_time'), `eat${eating}`, `mood${mood}`]});
    return;
  }

  let confirmation = `Evening report for ${date} `;
  const prev = await healthService.checkEvening(date, user_id);
  if(prev.length === 0){
    await healthService.addEvening(date, sport_time, study_time, eating, mood, user_id);
    confirmation += 'submitted!'
  } else {
    await healthService.updateEvening(date, sport_time, study_time, eating, mood, user_id);
    confirmation += 'updated!'
  }
  const completed = await healthService.reportsComplete(new Date().toISOString().substr(0, 10), (await session.get('user')).id )
  render('reporting.ejs', { loggedAs: await healthService.isLoggedIn(session), confirmation: confirmation, completed: completed });
}

Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

const summary = async({render, session}) => {
  const m = new Date().toISOString().substr(0, 7);
  const w = `${new Date().toISOString().substr(0, 4)}-W${new Date().getWeekNumber()}`;
  const user_id = (await session.get('user')).id;
  const month = await healthService.monthSummary(m.substr(5, 2), user_id);
  const week = await healthService.weekSummary(w.substr(6, 2), user_id);
  render('summary.ejs', {loggedAs: await healthService.isLoggedIn(session), defmonth: m, defweek: w, month: month, week: week})
}

const postSummary = async({request, render, session}) => {
  const body = request.body();
  const params = await body.value;
  const m = params.get('month');
  const w = params.get('week');
  const user_id = (await session.get('user')).id;
  const month = await healthService.monthSummary(m.substr(5, 2), user_id);
  const week = await healthService.weekSummary(w.substr(6, 2), user_id);
  render('summary.ejs', {loggedAs: await healthService.isLoggedIn(session), defmonth: m, defweek: w, month: month, week: week})
}

 
export { landing, reporting, morningReport, eveningReport, loginForm, postLoginform, registerForm, postRegisterform, logout, postMorningReport, postEveningReport, summary, postSummary };
import { executeQuery } from "../database/database.js";
import { configs } from "../config/config.js"
import { bcrypt } from "../deps.js"

const morning = configs.morningDBname;
const evening = configs.eveningDBname;
const userDB = configs.userDBname;

const addMorning = async(date, sleep_duration, sleep_quality, mood, user_id) => {
  await executeQuery(`INSERT INTO ${morning} (date, sleep_duration, sleep_quality, mood, user_id) VALUES ($1, $2, $3, $4, $5);`, 
  date, sleep_duration, sleep_quality, mood, user_id);
}

const checkMorning = async(date, user_id) => {
  const res = await executeQuery(`SELECT * FROM ${morning} WHERE date = $1 AND user_id = $2;`, date, user_id);
  return res.rowsOfObjects();
}

const updateMorning = async(date, sleep_duration, sleep_quality, mood, user_id) => {
  await executeQuery(`UPDATE ${morning} SET (sleep_duration, sleep_quality, mood) = ($2, $3, $4) WHERE date = $1 AND user_id = $5;`, 
  date, sleep_duration, sleep_quality, mood, user_id);
}

const addEvening = async(date, sport_time, study_time, eating, mood, user_id) => {
  await executeQuery(`INSERT INTO ${evening} (date, sport_time, study_time, eating, mood, user_id) VALUES ($1, $2, $3, $4, $5, $6);`, 
  date, sport_time, study_time, eating, mood, user_id);
}

const checkEvening = async(date, user_id) => {
  const res = await executeQuery(`SELECT * FROM ${evening} WHERE date = $1 AND user_id = $2;`, date, user_id);
  return res.rowsOfObjects();
}

const updateEvening = async(date, sport_time, study_time, eating, mood, user_id) => {
  await executeQuery(`UPDATE ${evening} SET (sport_time, study_time, eating, mood) = ($2, $3, $4, $5) WHERE date = $1 AND user_id = $6;`, 
  date, sport_time, study_time, eating, mood, user_id);
}

function formatted(amount) {
	let i = parseFloat(amount);
	if(isNaN(i)) { i = 0.00; }
	var minus = '';
	if(i < 0) { minus = '-'; }
	i = Math.abs(i);
	i = parseInt((i + .005) * 100);
	i = i / 100;
	let s = new String(i);
	if(s.indexOf('.') < 0) { s += '.00'; }
	if(s.indexOf('.') == (s.length - 2)) { s += '0'; }
	s = minus + s;
	return s;
}

const monthSummary = async(month, user_id) => {
  const morn = await executeQuery(`SELECT AVG(sleep_duration) as avgSD, AVG(sleep_quality) as avgSQ, AVG(mood) as avgMM FROM ${morning} 
  WHERE EXTRACT(MONTH FROM date) = $1 AND user_id = $2`, month, user_id);
  const evn = await executeQuery(`SELECT AVG(sport_time) as avgSP, AVG(study_time) as avgST, AVG(eating) as avgE, AVG(mood) as avgEM FROM ${evening} 
  WHERE EXTRACT(MONTH FROM date) = $1 AND user_id = $2`, month, user_id);
  return summary(morn, evn);
}

const weekSummary = async(week, user_id) => {
  const morn = await executeQuery(`SELECT AVG(sleep_duration) as avgSD, AVG(sleep_quality) as avgSQ, AVG(mood) as avgMM FROM ${morning} 
  WHERE EXTRACT(WEEK FROM date) = $1 AND user_id = $2`, week, user_id);
  const evn = await executeQuery(`SELECT AVG(sport_time) as avgSP, AVG(study_time) as avgST, AVG(eating) as avgE, AVG(mood) as avgEM FROM ${evening} 
  WHERE EXTRACT(WEEK FROM date) = $1 AND user_id = $2`, week, user_id);
  return summary(morn, evn);
}

const summary = (morn, evn) => {
  if (!morn || !evn){
    return {succesful: false};
  }
  const mObj = morn.rowsOfObjects()[0];
  const eObj = evn.rowsOfObjects()[0];
  if (Number(mObj.avgmm) < 1 || Number(eObj.avgem) < 1){
    return {succesful: false};
  }
  return {
    successful: true,
    sleep_duration: formatted(Number(mObj.avgsd)),
    sport_time: formatted(Number(eObj.avgsp)),
    study_time: formatted(Number(eObj.avgst)),
    sleep_quality: formatted(Number(mObj.avgsq)),
    eating: formatted(Number(eObj.avge)),
    mood: formatted((Number(mObj.avgmm) + Number(eObj.avgem)) / 2.0)
  }
}

const authenticate = async(email, password, session) => {
  
  const res = await executeQuery(`SELECT * FROM ${userDB} WHERE email = $1;`, email);
  if (res.rowCount === 0) {
      return [false, [["Invalid email or password"]]];
  }

  const userObj = res.rowsOfObjects()[0];

  const hash = userObj.password;

  const passwordCorrect = await bcrypt.compare(password, hash);
  if (!passwordCorrect) {
      return [false, [["Invalid email or password"]]];
  }

  await session.set('authenticated', true);
  await session.set('user', {
      id: userObj.id,
      email: userObj.email
  });
  return [true, [['Authentication successful!']]];
}

const register = async({request}) => {
  const body = request.body();
  const params = await body.value;
  
  const email = params.get('email');
  const password = params.get('password');
  const verification = params.get('verification');

  if (password !== verification) {
    return [false, [['The entered passwords did not match.']]];
  }

  if (password.length < 4) {
    return [false, [['The password must be at least 4 characters.']]];
  }

  const existingUsers = await executeQuery(`SELECT * FROM ${userDB} WHERE email = $1`, email);
  if (existingUsers.rowCount > 0) {
    return [false, [['The email is already reserved.']]];
  }

  const hash = await bcrypt.hash(password);
  await executeQuery(`INSERT INTO ${userDB} (email, password) VALUES ($1, $2);`, email, hash);
  return [true, [['Registration successful!']]];
};

const isLoggedIn = async(session) => {
  const user = await session.get('user');
  if(user){
    return user.email;
  }
  else {
    return '';
  }
};

const reportsComplete = async(date, user_id) => {
  const morning = (await checkMorning(date, user_id)).length;
  const evening = (await checkEvening(date, user_id)).length;
  if(morning && evening){
    return "You have completed both reports for today."
  }
  else if(morning){
    return "You have completed the morning report for today."
  }
  else if(evening){
    return "You have completed the evening report for today."
  }
  else {
    return "You haven't completed either report for today."
  }
}

const overallMood = async(date) => {
  const morn = await executeQuery(`SELECT AVG(mood) as avgmm FROM ${morning} WHERE date = $1`, date);
  const evn = await executeQuery(`SELECT AVG(mood) as avgem FROM ${evening} WHERE date = $1`, date);
  const mObj = morn.rowsOfObjects()[0];
  const eObj = evn.rowsOfObjects()[0];
  let div = 1.0;
  if(Number(mObj.avgmm) > Number(0) && Number(eObj.avgem) > Number(0)){
    div = 2.0;
  }
  return formatted((Number(mObj.avgmm) + Number(eObj.avgem)) / Number(div))
}

export { addMorning, checkMorning, updateMorning, addEvening, checkEvening, updateEvening, authenticate, register, isLoggedIn, reportsComplete, monthSummary, weekSummary, overallMood };
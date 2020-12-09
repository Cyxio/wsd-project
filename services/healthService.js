import { executeQuery } from "../database/database.js";
import { config } from "../config/config.js"
import { bcrypt } from "../deps.js"

const morning = config.morningDBname;
const evening = config.eveningDBname;

const addMorning = async(date, sleep_duration, sleep_quality, mood, user_id) => {
  await executeQuery(`INSERT INTO ${morning} (date, sleep_duration, sleep_quality, mood, user_id) VALUES ($1, $2, $3, $4, $5);`, 
  date, sleep_duration, sleep_quality, mood, user_id);
}

const checkMorning = async(date, user_id) => {
  const res = await executeQuery(`SELECT * FROM ${morning} WHERE date = $1 AND user_id = $2;`, date, user_id);
  return res.rowsOfObjects();
}

const updateMorning = async(date, sleep_duration, sleep_quality, mood, user_id) => {
  await executeQuery(`UPDATE ${morning} SET (sleep_duration = $2, sleep_quality = $3, mood = $4) WHERE date = $1 AND user_id = $5;`, 
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
  await executeQuery(`UPDATE ${evening} SET (sport_time = $2, study_time = $3, eating = $4, mood = $5) WHERE date = $1 AND user_id = $5;`, 
  date, sport_time, study_time, eating, mood, user_id);
}

const authenticate = async({request, session}) => {
  const body = request.body();
  const params = await body.value;

  const email = params.get('email');
  const password = params.get('password');

  const res = await executeQuery("SELECT * FROM users WHERE email = $1;", email);
  if (res.rowCount === 0) {
      return [false, [["Invalid email or password"]]];
  }

  const userObj = res.rowsOfObjects()[0];

  const hash = userObj.password;

  const passwordCorrect = await bcrypt.compare(password, hash);
  if (!passwordCorrect) {
      return [false, [["The credentials were incorrect"]]];
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

  const existingUsers = await executeQuery("SELECT * FROM users WHERE email = $1", email);
  if (existingUsers.rowCount > 0) {
    return [false, [['The email is already reserved.']]];
  }

  const hash = await bcrypt.hash(password);
  await executeQuery("INSERT INTO users (email, password) VALUES ($1, $2);", email, hash);
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

export { addMorning, checkMorning, updateMorning, addEvening, checkEvening, updateEvening, authenticate, register, isLoggedIn };
import { executeQuery } from "../database/database.js";
import { config } from "../config/config.js"

const morning = config.morningDBname;
const evening = config.eveningDBname;

const addMorning = async(date, sleep_duration, sleep_quality, mood, user_id) => {
  await executeQuery(`INSERT INTO ${morning} (date, sleep_duration, sleep_quality, mood, user_id) VALUES ($1, $2, $3, $4, $5);`, 
  date, sleep_duration, sleep_quality, mood, user_id);
}
const checkMorning = async(date) => {
  res = await executeQuery(`SELECT * FROM ${morning} WHERE date = $1;`, date)
  return res.rowsOfObjects()
}

const addEvening = async(date, sport_time, study_time, eating, mood, user_id) => {
  await executeQuery(`INSERT INTO ${evening} (date, sport_time, study_time, eating, mood, user_id) VALUES ($1, $2, $3, $4, $5, $6);`, 
  date, sport_time, study_time, eating, mood, user_id);
}

const checkEvening = async(date) => {
  res = await executeQuery(`SELECT * FROM ${evening} WHERE date = $1;`, date)
  return res.rowsOfObjects()
}

export { addMorning, checkMorning, addEvening, checkEvening };
import * as healthService from "../../services/healthService.js";
import { executeQuery } from "../../database/database.js"
import { configs } from "../../config/config.js"

const morning = configs.morningDBname;
const evening = configs.eveningDBname;

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

const weekSummary = async({response}) => {
    const today = new Date();
    const weekbefore = new Date();
    weekbefore.setDate(today.getDate() - 7);
    const morn = await executeQuery(`SELECT AVG(sleep_duration) as avgSD, AVG(sleep_quality) as avgSQ, AVG(mood) as avgMM FROM ${morning} 
    WHERE date BETWEEN $1 AND $2`, weekbefore, today);
    const evn = await executeQuery(`SELECT AVG(sport_time) as avgSP, AVG(study_time) as avgST, AVG(mood) as avgEM FROM ${evening} 
    WHERE date BETWEEN $1 AND $2`, weekbefore, today);
    const mObj = morn.rowsOfObjects()[0];
    const eObj = evn.rowsOfObjects()[0];
    response.body = {
      sleep_duration: formatted(Number(mObj.avgsd)),
      sport_time: formatted(Number(eObj.avgsp)),
      study_time: formatted(Number(eObj.avgst)),
      sleep_quality: formatted(Number(mObj.avgsq)),
      mood: formatted((Number(mObj.avgmm) + Number(eObj.avgem)) / 2.0)
    }
}

const daySummary = async({params, response}) => {
    const today = `${Number(params.year)}-${Number(params.month)}-${Number(params.day)}`;
    const morn = await executeQuery(`SELECT AVG(sleep_duration) as avgSD, AVG(sleep_quality) as avgSQ, AVG(mood) as avgMM FROM ${morning} 
    WHERE date = $1`, today);
    const evn = await executeQuery(`SELECT AVG(sport_time) as avgSP, AVG(study_time) as avgST, AVG(mood) as avgEM FROM ${evening} 
    WHERE date = $1`, today);
    const mObj = morn.rowsOfObjects()[0];
    const eObj = evn.rowsOfObjects()[0];
    response.body = {
      sleep_duration: formatted(Number(mObj.avgsd)),
      sport_time: formatted(Number(eObj.avgsp)),
      study_time: formatted(Number(eObj.avgst)),
      sleep_quality: formatted(Number(mObj.avgsq)),
      mood: formatted((Number(mObj.avgmm) + Number(eObj.avgem)) / 2.0)
    }
}
   
export { weekSummary, daySummary };
import * as healthService from "../../services/healthService.js";

const hello = async({render}) => {
  render('index.ejs', { hello: 'Hello World!' });
}

const reporting = async({render}) => {
  render('reporting.ejs');
}

const morningReport = async({render}) => {
  render('morningReport.ejs', { dateToday: new Date().toISOString().substr(0, 10) } )
}

 
export { hello, reporting, morningReport };
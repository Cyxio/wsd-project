import * as healthService from "../../services/healthService.js";

const getHello = async({response}) => {
    response.body = { message: await healthService.getHello() };
};

const addMorning = async({request, response}) => {
    const body = request.body({type: 'json'});
    const document = await body.value;
    healthService.setHello(document.message);
    response.redirect = "/behavior/reporting";
};
   
export { getHello, addMorning };
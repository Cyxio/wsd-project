import { getHello } from "../../services/healthService.js";

const hello = async({render}) => {
  render('index.ejs', { hello: await getHello() });
};
 
export { hello };
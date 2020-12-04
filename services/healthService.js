import { executeQuery } from "../database/database.js";

const getHello = async() => {
  const res = await executeQuery("SELECT message FROM messages ORDER BY id DESC LIMIT 1");
  if (res && res.rowCount > 0) {
    return res.rowsOfObjects()[0].message;
  }

  return 'No messages available';
}

const setHello = async(newMessage) => {
  await executeQuery("INSERT INTO messages (message, sender) VALUES ($1, 'API');", newMessage);
}

export { getHello, setHello };
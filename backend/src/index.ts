import colors from "colors";
import server from "./server";

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(colors.bgWhite.blue.bold(`Server en http://localhost:${PORT}/`));
});

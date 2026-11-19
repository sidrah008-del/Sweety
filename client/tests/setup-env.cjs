
const dotenv = require("../../server/node_modules/dotenv");
const path = require("path");

module.exports = async () => {
  dotenv.config({
    path: path.resolve(__dirname, "../../server/.env")
  });
};

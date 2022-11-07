const mysql = require("mysql");

var con = mysql.createConnection({
  host: "goliathback.conhgft0hcmt.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "gl1M4yO1Hj1vOhCk",
  database: "opensea"
});

module.exports = con;

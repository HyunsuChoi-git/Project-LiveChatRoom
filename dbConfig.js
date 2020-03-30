/* DB info */

module.exports = {
  user : process.env.NODEORACLEDB_USER || "java17",
  password : process.env.NODEORACLEDB_PASSWORD || "java17",
  connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "nullmaster.iptime.org:3000/orcl"
}

const { Pool } = require('pg');
const pool = new Pool({
  user: '<YOUR USER HERE>',
  host: '<YOUR DB IP HERE>',
  database: 'YOUR DB NAME HERE>',
  password: 'YOUR DB PASSWORD HERE',
  port: 5432,
})

module.exports = pool
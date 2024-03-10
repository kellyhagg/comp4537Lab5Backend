// Import messages from the user.js file
import messages from './lang/messages/en/user.js';

// This file was made with the assistance of ChatGPT-4
const http = require('http');
const url = require("url");
const { Pool } = require("pg");

// Constants
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS patients (
        patientid SERIAL PRIMARY KEY,
        name VARCHAR(100),
        dateOfBirth TIMESTAMP 
    );  
`; //Engine=InnoDB omitted as this does not apply to PostgreSQL

const PORT = process.env.PORT || 3306;
const connectionString = 'postgresql://user:HXXCWitQFL4qzBFkK3PWLQ@pocket-orca-4395.g95.gcp-us-west2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

// Create a new pool using the connection string
const pool = new Pool({
  connectionString: connectionString,
});

// Create a new server
http.createServer((req, res) => {
  let q = url.parse(req.url, true);
  let pathname = q.pathname;
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
  } else if (pathname.includes("/lab5/api/v1/sql/")) {
    let sql = pathname.substring(pathname.lastIndexOf('/') + 1);
    let clean_sql = sql.replace(/%20/g, " ");

    // Validate the SQL query
    pool.query(clean_sql, (err, result) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end(sqlError);
      } else {
        console.log(result);
        let table = "<table>";
        for (let i = 0; i < result.length; i++) {
          table += `<tr><td>${result[i].patientid}</td><td>${result[i].name}</td><td>${result[i].dateOfBirth}</td></tr>`;
        }
        table += "</table>";

        res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.write(table);
        res.end();
      }
    });
  } else if (req.method === "POST" && pathname == "/lab5/insert") {
    let body = "";

    req.on('data', function (chunk) {
      if (chunk != null) {
        body += chunk;
      }
    });

    // Create the table if it does not exist
    pool.query(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating the table:', err);
      }
    });

    req.on("end", () => {
      let data = JSON.parse(body);

      // Validate the SQL query inside the POST data
      if (!isValidQuery(data.query)) {
        res.writeHead(403, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end("Forbidden operation. Only SELECT and INSERT queries are allowed.");
        return;
      }

      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating the table:', err);
        }
      });

      pool.query(data.query, (err, result) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
          res.end("SQL error, please check SQL query" + err.message);
        } else {
          console.log(result);
          res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
          res.end(postReceived);
        }
      });
    });
  } else if (req.method === "GET" && pathname.includes("/lab5/select")) {
    let sql = pathname.substring(pathname.lastIndexOf('/') + 1);
    let clean_sql = sql.replace(/%20/g, " ");

    // Validate the SQL query
    if (!isValidQuery(clean_sql)) {
      res.writeHead(403, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
      res.end(forbiddenOperation);
      return;
    }

    pool.query(clean_sql, (err, result) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end(sqlError);
      } else {
        console.log(result);
        res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ response: `GET request received`, result }));
      }
    });
  } else {
    // Handle other requests
    res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
    res.write("<p>home page</p>");
    res.end();
  }

}).listen(PORT, () => console.log(`Server is running and listening on port: ${PORT}`));

// Function to validate if the query is a SELECT or INSERT
function isValidQuery(sql) {
  const queryType = sql.trim().split(' ')[0].toUpperCase();
  return queryType === 'SELECT' || queryType === 'INSERT';
}

// Log the port that the server is running on
console.log("Server is running and listening on port: " + PORT);
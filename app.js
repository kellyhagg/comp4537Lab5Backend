const http = require('http');
const url = require("url");
const mysql = require("mysql");

// Constants
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS patients (
        patientid INT(10) UNSIGNED ZEROFILL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        dateOfBirth DATETIME
    ) ENGINE=InnoDB;
`;
const HOST = "sql3.freesqldatabase.com";
const USER = "sql3690024";
const PASSWORD = "eUfYHeHLgF";
const DATABASE = "sql3690024";
const PORT = process.env.PORT || 3306;

const con = mysql.createPool({
  host: HOST,
  user: USER,
  password: PASSWORD,
  database: DATABASE
});

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

    con.query(clean_sql, (err, result) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end("SQL error, please check query");
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

    con.query(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating the table:', err);
      }
    });

    req.on("end", () => {
      let data = JSON.parse(body);


      con.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating the table:', err);
        }
      });

      con.query(data.query, (err, result) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
          res.end("SQL error, please check SQL query" + err.message);
        } else {
          console.log(result);
          res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
          res.end("POST request received");
        }
      });
    });
  } else if (req.method === "GET" && pathname.includes("/lab5/select")) {
    let sql = pathname.substring(pathname.lastIndexOf('/') + 1);
    let clean_sql = sql.replace(/%20/g, " ");

    con.query(clean_sql, (err, result) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end("SQL error, please check SQL query");
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

console.log("Server is running and listening on port: " + PORT);
const express = require("express");
const mysql   = require("mysql");
const session = require('express-session');

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public")); //folder for images, css, js
app.use(express.urlencoded()); //use to parse data sent using the POST method
app.use(session({ secret: 'any word', cookie: { maxAge: 60000 }}))

// app.use(myMiddleware);

// function myMiddleware(req, res, next){
//   console.log(new Date());
//   next()
// }

//routes
app.get("/", function(req, res){
   req.session.authenticated = false;
   res.render("login");
});

app.get("/checkout", function(req, res){
    res.render("checkout");
});

// app.get("/admin", async function(req, res){
    
//   console.log("authenticated: ", req.session.authenticated);    
   
//   if (req.session.authenticated) { //if user hasn't authenticated, sending them to login screen
       
//     //  let authorList = await getAuthorList();  
//       //console.log(authorList);
//       res.render("admin", {"authorList":authorList});  
       
//   }  else { 
    
//       res.render("login"); 
   
//   }
// });

app.post("/loginProcess", async function(req, res) {
    // let rows = await insertAuthor(req.body);
    if(req.body.action == "login"){
        let result = await validateLogin(req.body.username, req.body.password);
        console.log(result);
        if(result != 0){
            res.send(true);
        } else {
            res.send(false);
        }
    } else if (req.body.action == "new"){
        let result = await createAccount(req.body.username, req.body.password);
        if(result.affectedRows > 0){
            res.send(true);
        } else {
            res.send(false);
        }
    } else if (req.body.action == "admin"){
        
    }
});

app.post("/getGames", async function(req, res) {
    // let rows = await insertAuthor(req.body);
    let rows = await getGames(req.body);
    res.send(rows);
});

// app.post("/addAuthor", async function(req, res){
//   //res.render("newAuthor");
//   let rows = await insertAuthor(req.body);
//   console.log(rows);
//   //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
//   let message = "Author WAS NOT added to the database!";
//   if (rows.affectedRows > 0) {
//       message= "Author successfully added!";
//   }
//   res.render("newAuthor", {"message":message});
    
// });

// app.get("/updateAuthor", async function(req, res){

//   let authorInfo = await getAuthorInfo(req.query.authorId);    
//   //console.log(authorInfo);
//   res.render("updateAuthor", {"authorInfo":authorInfo});
// });

// app.post("/updateAuthor", async function(req, res){
//   let rows = await updateAuthor(req.body);
  
//   let authorInfo = req.body;
//   console.log(rows);
//   //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
//   let message = "Author WAS NOT updated!";
//   if (rows.affectedRows > 0) {
//       message= "Author successfully updated!";
//   }
//   res.render("updateAuthor", {"message":message, "authorInfo":authorInfo});
    
// });

function validateLogin(user, pass){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT count(*) from db_users where userName = ?
                      AND password = ?`;
        
           let params = [user, pass];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows[0]['count(*)']);
           });
        
        });
    });
}

function createAccount(user, pass){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `INSERT into db_users(userName, password) values (?, ?)`;
        
           let params = [user, pass];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });
    });
}

function insertGame(info){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
           let params = [];
           let sql = `INSERT INTO db_inventory
                      VALUES(?, ?, ?, ?, ?, ?, ?, 0`;
           params.push(info.title);
           params.push(info.console);
           params.push(info.new);
           params.push(info.image);
           params.push(info.price);
           params.push(info.desc);
           params.push(info.stock);
           
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve();
           });
        
        });//connect
    });//promise 
}
function deleteGame(info){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
           let params = [];
           let sql = `DELETE FROm db_inventory WHERE
                      id = ?`;
           params.push(info.id);
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve();
           });
        
        });//connect
    });//promise 
}
function getLowStock(){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT * from
                      FROM db_inventory WHERE stock < 5 
                      GROUP BY stock`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}
function getTopTenSales(){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT * from
                      FROM db_inventory 
                      GROUP BY sold order desc
                      limit 10`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}
function getTotalSales(){
   
   let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT total(sold)
                      FROM db_inventory`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows[0]); //Query returns only ONE record
           });
        
        });//connect
    });//promise 
}

function getGames(query){
    
    let keyword = query.keyword;
    
    let conn = dbConnection();
    
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let params = [];
        
           let sql = `SELECT * FROM db_inventory
                      WHERE 
                      title LIKE '%${keyword}%'`;
        
           if (query.console) { //user selected a category
              sql += " AND category = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
              params.push(query.console);
           }
           console.log(query.new);
           if (query.new){
               sql += " AND new = ?";
               params.push(query.new);
           }
           console.log(query.order);
           if(query.order){
               sql += " order by ";
               params.push(query.order);
           }
           
           console.log(params);
           console.log("SQL:", sql);
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise
    
}//getQuotes

function dbConnection(){

   let conn = mysql.createConnection({
                 host: "cst336db.space",
                 user: "cst336_dbUser2",
             password: "4lfan8",
             database: "cst336_db2"
       }); //createConnection

return conn;
}


//starting server
app.listen(process.env.PORT, process.env.IP, function(){
console.log("Express server is running...");
});
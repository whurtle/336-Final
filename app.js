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
    var authAdmin = false;
    var authUser = false;
   //req.session.authenticated = false;
   res.render("login");
});

app.get("/checkout", async function(req, res){
    if(req.session.authUser){
        let rows = await getCart("alex");
        console.log(rows);
        res.render("checkout", {"cartItems": rows});
    }
    else{
        res.render('login');
    }
});

app.get("/search", function(req, res){
    if(req.session.authUser){
        res.render("search");
    }
    else{
        res.render('login');
    }
});

app.get("/admin", function(req, res){
    if(req.session.authAdmin){
        res.render("admin");
    }
    else{
        res.render('login');
    }
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
            req.session.authUser = true;
            res.send(true);
        } else {
            res.send(false);
        }
    } else if (req.body.action == "new"){
        let result = await createAccount(req.body.username, req.body.password);
        if(result.affectedRows > 0){
            req.session.authUser = true;
            res.send(true);
        } else {
            res.send(false);
        }
    } else if (req.body.action == "admin"){
        let result = await validateAdmin(req.body.username, req.body.password);
        console.log(result);
        if(result != 0){
            req.session.authUser = true;
            req.session.authAdmin = true;
            res.send(true);
        } else {
            res.send(false);
        }
    }
});

app.post("/getGames", async function(req, res) {
    if(req.session.authUser){
        let rows = await getGames(req.body);
        res.send(rows);
    }
    else{
        res.render('login');
    }
});

app.post("/addCart", async function(req, res){
    if(await containsItem(req.body) == true){
        
        await incrCart(req.body);
        res.send({res: "Added one more"});
    } else {
        
        
        await addCart(req.body);
        res.send({res: "Added one more"});
    }
});

app.get("/getCart", async function(req, res){
   let rows = await getCart(req.body.userName); 
});

app.delete("/deleteCart", async function(req, res){
    let conn = dbConnection();
       conn.connect(function(err) {
       if (err) throw err;
       console.log("Connected!");
    
       let sql = `DELETE FROM db_cart WHERE userName = ?`;
    
       let params = [req.body.userName];
    
       conn.query(sql, params, function (err, rows, fields) {
          if (err) throw err;
          //res.send(rows);
          conn.end();
       });
        
    });
});

app.post("/addGame", async function(req, res){
       let conn = dbConnection();
   conn.connect(function(err) {
       if (err) throw err;
       console.log("Connected!");
    
       let sql = `INSERT INTO db_inventory(title, console, new, image, price, description, stock, sold) VALUES(?, ?, ?, ?, ?, ?, ?, 0);`;
       
       let params = [req.body.title, req.body.console, req.body.new, req.body.image, req.body.price, req.body.desc, req.body.stock];
    
       conn.query(sql, params, function (err, rows, fields) {
          if (err) throw err;
          //res.send(rows);
          conn.end();
       });
        
    });
});

app.delete("/deleteGame", async function(req, res){
       let conn = dbConnection();
       conn.connect(function(err) {
       if (err) throw err;
       console.log("Connected!");
    
       let sql = `DELETE FROM db_inventory WHERE id = ?`;
    
       let params = [req.body.gameID];
    
       conn.query(sql, params, function (err, rows, fields) {
          if (err) throw err;
          //res.send(rows);
          conn.end();
       });
        
    });
});

app.post("/addStock", async function(req, res){
       let conn = dbConnection();
       conn.connect(function(err) {
       if (err) throw err;
       console.log("Connected!");
    
       let sql = `UPDATE db_inventory
                  SET stock = stock + ?
                  where id = ?`;
    
       let params = [req.body.value, req.body.id];
    
       conn.query(sql, params, function (err, rows, fields) {
          if (err) throw err;
          //res.send(rows);
          conn.end();
       });
        
    });
});

app.get("/reports", async function(req, res){
  let report1 = await getLowStock();
  let report2 = await getTopThreeSales();
  let report3 = await getTotalSales();
  res.send({report1, report2, report3});
});
app.post("/updateStock", async function(req, res){
       let conn = dbConnection();
       conn.connect(function(err) {
       if (err) throw err;
       console.log("Connected!");
    
       let sql = `UPDATE db_inventory
                  SET stock = stock - ?,
                  sold = sold + ?
                  where image = ?;`;
    
       let params = [req.body.change, req.body.change, req.body.image];
    
       conn.query(sql, params, function (err, rows, fields) {
          if (err) throw err;
          //res.send(rows);
          conn.end();
       });
        
    });
});

function getCart(userName){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `select inventory_id, title, image, price, count from db_users natural join db_cart join db_inventory on db_cart.inventory_id = db_inventory.id where userName = ?;`;
        
           let params = [userName];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });
    });
}

function containsItem(body){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `select count(*) from db_cart where userName = ? and inventory_id = ?`;
        
           let params = [body.user, body.game];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              console.log(rows[0]["count(*)"]);
              conn.end();
              resolve(rows[0]["count(*)"] > 0);
              //res.send(rows);
           });
        });
    });
}

function addCart(body){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `INSERT into db_cart(userName, inventory_id, count) VALUES(?, ?, 1) ;`;
           
           let params = [body.user, body.game];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });
    });
}

function incrCart(body){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
           let sql =`
                      UPDATE db_cart
                      SET count = count + 1 
                      WHERE userName = ? and inventory_id = ?;`;
        
           let params = [body.user, body.game];
        
           conn.query(sql, params, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve();
           });
        });
    });
}

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

function validateAdmin(user, pass){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT count(*) from db_admin where adminName = ?
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
        
           let sql = `SELECT *
                      FROM db_inventory WHERE stock < 30 
                      GROUP BY stock;`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows);
           });
        
        });//connect
    });//promise 
}
function getTopThreeSales(){
    let conn = dbConnection();
    return new Promise(function(resolve, reject){
        conn.connect(function(err) {
           if (err) throw err;
           console.log("Connected!");
        
           let sql = `SELECT *
                      FROM db_inventory 
                      order by sold desc
                      limit 3;`;
        
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
        
           let sql = `SELECT sum(sold)
                      FROM db_inventory;`;
        
           conn.query(sql, function (err, rows, fields) {
              if (err) throw err;
              //res.send(rows);
              conn.end();
              resolve(rows); //Query returns only ONE record
           });
        
        });//connect
    });//promise 
}
// function getCart(query){
//     let conn = dbConnection();
//     return new Promise(function(resolve, reject){
//         conn.connect(function(err) {
//           if (err) throw err;
//           console.log("Connected!");
        
//           let params = [];
        
//           let sql = `SELECT * FROM db_inventory
//                       WHERE 
//                       title LIKE '%${keyword}%'`;
        
//           if (query.console) { //user selected a category
//               sql += " AND console = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
//               params.push(query.console);
//           }
//           console.log(query.new);
//           if (query.new){
//               sql += " AND new = ?";
//               params.push(query.new);
//           }
//           console.log(query.order);
//           if(query.order){
//               sql += " order by ?";
//               params.push(query.order);
//           }
           
//           console.log(params);
//           console.log("SQL:", sql);
//           conn.query(sql, params, function (err, rows, fields) {
//               if (err) throw err;
//               //res.send(rows);
//               conn.end();
//               resolve(rows);
//           });
        
//         });//connect
//     });//promise
// }
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
              sql += " AND console = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
              params.push(query.console);
           }
           console.log(query.new);
           if (query.new){
               sql += " AND new = ?";
               params.push(query.new);
           }
           console.log(query.order);
           if(query.order){
               sql += " order by ?";
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
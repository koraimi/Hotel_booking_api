require('dotenv').config()
const express = require('express')
const initSqlJs = require("sql.js")
const fs = require("fs")
const cors = require("cors")
const path = require('path');



const usersRoute = require('./routes/users')
const adminsRoute = require('./routes/admins')
const hotelsRoute = require('./routes/hotels')

const app = express()
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.static('public'));
app.use(cors())
app.use('/uploads', express.static('uploads'))

function saveDb(db) {
const data = db.export();
fs.writeFileSync("database.sqlite", Buffer.from(data))
}

(async () => {
const SQL = await initSqlJs();
const DB_PATH = "database.sqlite";
let db;

if (fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 0) {
console.log("loading existing database...");
const fileBuffer = fs.readFileSync(DB_PATH);
db = new SQL.Database(fileBuffer);
} else {
console.log("Creating NEW database...");
db = new SQL.Database();
db.run(`CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE,
password TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS admins(
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE,
password TEXT,
user_bookings TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS hotels(
id INTEGER PRIMARY KEY AUTOINCREMENT,
hotelname TEXT, rooms TEXT, price DOUBLE,
city TEXT, phone TEXT, email TEXT UNIQUE,
photos TEXT, location TEXT, owner TEXT
)`)
db.run(`CREATE TABLE IF NOT EXISTS bookings(
id INTEGER PRIMARY KEY AUTOINCREMENT,
userid INTEGER, adminid INTEGER,
hotelname TEXT, username TEXT, price DOUBLE,
date_start TEXT, date_end TEXT, state BOOL
)`)
saveDb(db);
console.log("started.");
}

// Pass database to all routes
usersRoute.setDb(db)
adminsRoute.setDb(db)
hotelsRoute.setDb(db, () => saveDb(db))

app.get('/', (req, res,next)=>{
try{


res.sendFile(path.join(__dirname, 'public', 'index.html'));


}catch(err){
next(err);
}
});
// Use routes
app.use('/', usersRoute.router)
app.use('/', adminsRoute.router)
app.use('/', hotelsRoute.router)
app.use((err, req, res, next) => {
console.error(err.message)
res.status(500).json({
message: 'something went wrong'
})
})
let running = true;

async function start() {
while (running) {
await checkbookings();
await new Promise(r => setTimeout(r, 2000000));
}
}


async function checkbookings(){

const date = new Date().toISOString();

db.run(`DELETE FROM bookings WHERE date_end < ?`, [date]);




saveDb(db)



}
const Port = process.env.PORT || 3000;
app.listen(Port, () => {
console.log('server started')

console.log(`Server is up on port ${Port}` );
start();
});

})();
require('dotenv').config()
const express = require('express')
const initSqlJs = require("sql.js")
const fs = require("fs")
const cors = require("cors")
const multer = require("multer")
const jwt = require("jsonwebtoken")
const path = require('path')
const bcrypt = require('bcryptjs')

const upload = multer( {
storage: multer.diskStorage({
destination: 'uploads/',
filename: (req, file, cb)=>cb(null, Date.now()+"_"+file.originalname)
})});


const app = express()
app.use(express.json())
app.use(express.static('public'));
app.use(cors())
app.use('/uploads', express.static('uploads'))


//app.use(express.urencoded({extended: true})) // <--- required
let SQL;
let db;

//admin database


//users database;

(async () => {
SQL = await initSqlJs();

const DB_PATH = "database.sqlite";

// If DB exists AND id → read it
if (fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 0) {
console.log("loading existing database...");

const fileBuffer = fs.readFileSync(DB_PATH);
db = new SQL.Database(fileBuffer);

} else {
console.log("Creating NEW database...");

db = new SQL.Database();

// Create tabes
db.run(` CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE,
password TEXT
);`);

db.run(`CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT, username  TEXT UNIQUE,
password TEXT,user_bookings TEXT);`);

db.run('CREATE TABLE IF NOT EXISTS hotels(id INTEGER PRIMARY KEY AUTOINCREMENT,hotelname TEXT,rooms TEXT,price DOUBLE,city TEXT,phone TEXT,email  TEXT UNIQUE , photos TEXT,location TEXT,owner TEXT)')

db.run('CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY AUTOINCREMENT,userid INTEGER ,adminid INTEGER,hotelname TEXT,username TEXT,price DOUBLE,date_start TEXT ,date_end TEXT,state BOOL)')

// Save the new DB
const data = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(data));
console.log("started.");
}

saveDb()
})();

function saveDb() {

const data = db.export();
// fs.open("database.sqite");
fs.writeFileSync("database.sqlite",
Buffer.from(data))
}

function print() {
const result = db.exec('SELECT * FROM  users')


console.log("below is result [1]")
for (let i = 0; i < result[0].values.length; i++) {
console.log("value is :"+result[0].values[i])
}
console.log("print function")
}






console.log("starting:")






app.get('', (req, res) => {
res.send('public/index.html')
})
app.get('/redirect0', (req, res)=> {
console.log("redirecting...")
res.send('register.html')
})
const SECRET_KEY = process.env.SECRET_KEY;

app.post('/register', async (req, res) => {
// const data=JSON.stringify(req.body)

const data = JSON.stringify(req.body);
const user = req.body;
const compare = db.exec('SELECT * FROM users')[0];
if (compare) {


let v = compare.values;
let found = false;
v.forEach((item) => {

let usrn = item[1];
let pass = item[2];


if (usrn == user.username) {
console.log(item)
console.log("the username already taken")
found = true;
}





})
if (found) {

// saveDb()
console.log(req.body)

console.log(data.username);
console.log(data.password)


res.send("user alreday exists try again")

} else {

const hashed = await bcrypt.hash(user.password, 10)
console.log("this debubing " +user.username)
db.run("INSERT INTO users (username, password) VALUES (?, ?);", [
user.username, hashed]);
//
console.log(req.body)

console.log(data.username);
console.log(data.password)



res.send("registread succses")
}
} else {
const hashed = await bcrypt.hash(user.password, 10)
db.run("INSERT INTO users (username, password) VALUES (?, ?);", [
user.username, hashed]);
res.send("registread succses")
}
print();
saveDb()
});

app.post('/login', async (req, res)=> {
console.log("login")
const data = req.body



const listofUsers = db.exec("SELECT * FROM users")[0];
if (listofUsers) {
const rows = listofUsers.values;
let isuser = false;
let user = {};
console.log(data)
console.log(rows)
console.log(listofUsers)
rows.forEach(async (item) => {

//console.logle.loge.og(item[1])
//console.logle.loge.og(item[2])

const passwordMatch = await bcrypt.compare(data.password, item[2])
if (item[1] == data.username && passwordMatch) {
user = item;
user.id = item[0]
console.log(item)
isuser = true
console.log('password matched')
const token = jwt.sign({
id: user.id, username: data.username, role: "user"
}, process.env.SECRET_KEY, {
expiresIn: '1h'
});
console.log('id is '+user.id)

const js = {
username: data.username,
token: token,
url: 'Main.html'
}

console.log(js)
res.json(js)

} else {
const js = {
status: 400,
message: "error no such user"
}
res.status(400);
res.send('some error');
}



});
} else {
let js = {
message: 'error'
};
res.status(401)
res.send("no user")
}

// ("oppps")




})

app.post("/upload", authenticateToken,
isAdmin, upload.array("images"), (req, res)=> {
// console.logle.loge.og(req.user)
console.log("admins route")
console.log("authentication ? "+req.user.username)
console.log(req.user.role)
const data = req.body;
const imgs = req.files;
const imageurs = req.files.map(file => `/uploads/${file.filename}`);


const admin = db.exec('SELECT * FROM admins ')[0];


const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
let owner = req.user.username;

console.log('logdata :: ')
console.log(data.hotelname+data.rooms+data.email+imgs.src+data.loc)
if (!admin) {



console.log("error selecting admins")
res.send("error 404");
} else {
if (owner) {
console.log("current user"+owner)
const match = admin.values.find(l => l[1] === owner);
if (match) {
console.log("owner is "+owner+"user is ")
console.log(imageurs)
let type = JSON.stringify(imageurs)
console.log(typeof(imageurs))
console.log(type)
console.log(typeof(type))
console.log(data)
db.exec('INSERT INTO hotels(hotelname,rooms,price,city,phone,email,photos,location,owner) VALUES(?,?,?,?,?,?,?,?,?);', [data.hotelname, data.rooms, data.price, data.city, data.phone, data.email, type, data.loc, owner]);
res.send("uploaded succsess")
saveDb();
} else {
console.log("no admin")
console.log(owner)
res.status(403).json({
message: "no admin found"
});
//res.send("upload failed")
}





//console.logle.loge.og(exsists)

// console.logle.loge.og(admin.ues)


} else {
res.send("error un unauthorizied accses")
}




}
})
//app.get('/admin', authenticateToken, (req, res)=> {})

app.post('/adminlog', async (req, res)=> {
console.log("admin log")

const us = req.body;
let user = {};
let session = [];
//console.logle.loge.og(us)
let isfound = false;
const dbres = db.exec('SELECT * FROM admins')[0];
if (!dbres) {
console.log('1')
return res.send('no regitred users yet')
}

const admin = dbres.values.find(ad => ad[1] == us.username);
if (!admin) {
console.log('2')
return res.json('wrong credentials')
}
console.log('admin password plain'+admin[2])
const passwordMatch = await bcrypt.compare(us.password, admin[2]);
if (us.username == admin[1] && passwordMatch) {

const token = jwt.sign({
id: us.id, username: us.username, role: "admin"
}, process.env.SECRET_KEY, {
expiresIn: '1h'
});
const js = {
username: us.username,
token: token,
url: 'admin_main.html'
}

res.json(js);
} else {
console.log('3')
res.json({meassage:'wrong credentials'})
}

})

app.get('/admin-register',
async (req, res)=> {
console.log("****")
res.send('regdiv.html')
// ("regdiv")
})

app.post('/admin-register-user',
async (req, res)=> {
console.log("admin register -user")
const usd = req.body;
console.log(usd)
const hashed = await bcrypt.hash(usd.password, 10)
const dbret = db.exec('SELECT * FROM admins')[0];
if (dbret) {
console.log(dbret)

const val = dbret.values;



const found = dbret.values.find(u => u[1] == usd.username)
console.log("found"+found)
if (!found) {
db.run('INSERT INTO admins(username,password) VALUES(?,?);', [usd.username, hashed]);


res.send("registered")
saveDb();
} else {
res.send("there is some user with the same name try onother")
}
} else {
const hashed = await bcrypt.hash(usd.password, 10)
console.log("there is a problem")
db.run('INSERT INTO admins(username,password) VALUES(?,?);', [usd.username, hashed]);
res.send("database is empty looks like you are the first user")

saveDb();
}
})

app.get('/admin_profile',
authenticateToken,
isAdmin,
(req, res)=> {
console.log('manage route')

const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
let owner = req.user.username;


const admins = db.exec("SELECT * FROM admins")[0]

if (admins) {
console.log('this admin is ' + owner)
const match = admins.values.find(admin => admin[1] === owner);
if (match) {


let hotel_list = db.exec('SELECT * FROM hotels ')[0];

console.log('type of'+typeof(hotel_list))

if (hotel_list) {
const val = hotel_list.values;
const target = val.find(h => h[9] === owner);
console.log('there is a hotel')
if (!target) return res.send("<h2>error no hotel found</h2>")

console.log(target[1])
console.log(target[7])
const photos = JSON.parse(target[7]);

let imges = "";

console.log("type of photos is : "+typeof(photos))
console.log(photos)
photos.forEach((img)=> {
imges += `<img src="${img}"></img>`
})

if (target) {
let html = `<h1> hotelname ${target[1]}</h1>
<h3>total number of rooms ${target[2]}</h3>
<p> room price is${target[3]}</p>
<p>city ${target[4]}</p>
<div>${imges}</div>
`;
console.log(target)
console.log(target[1])
console.log(target[7])

res.send(html)
} else {
res.send("<h2>error no hotel found</h2>")



}
} else {
res.send(`<h2>error no hotels found in database</h2>`
)
}
} else {
res.send(`h2>unauthorisied please login with your account</h2>`
)
}
} else {
res.send(`h2>no admins yet error</h2>`)
}
})
app.get('/adminpanel',
authenticateToken,
isAdmin,
(req, res)=> {

const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
let owner = req.user.username;


console.log("user is"+ owner)

const admins = db.exec("SELECT * FROM admins")[0];
if (admins) {


console.log('adminpanel route')
let js = {
username: owner,
url: 'adminpanel.html'

}
res.send('hotelinfo.html');
} else {
res.status(403).json({
message: 'no admins found'
});
}




})

app.get('/printall',
(req, res)=> {
console.log('print')
printsessions();
res.send("ok")
})
app.get('/findHotels',
authenticateToken,
(req, res)=> {

const hotels = db.exec("SELECT * FROM hotels ")[0];

let arr = [];

if (!hotels) return res.json({
error: 'no hotels found'
})

hotels.values.forEach(hot => {
let js = {};
js.hotelname = hot[1];
let photos = JSON.parse(hot[7]);
console.log('photos')
console.log(photos)
js.img = photos[0];
arr.push(js)
})

console.log(arr)
res.send(arr)



})

app.get('/hotel/:h',
authenticateToken,
(req, res)=> {
const name = req.params.h;
const hotels = db.exec("SELECT * FROM hotels")[0]
if (hotels) {
const thehotel = hotels.values.find(hname => hname[1] === name);

console.log(name);
console.log(thehotel);
res.json(thehotel);
} else {
console.log("no hotels !!!")
res.send('no hotel found!!?')
}
})

app.get('/logout',
authenticateToken,
(req, res)=> {

let js = {};
js.action = "logout";
js.url = 'login.html'

console.log("logging out")
res.json(js)

})
app.get('/logoutadmin',
authenticateToken,
isAdmin,
(req, res)=> {

let js = {};
js.action = "logout";
js.url = 'adminlogin.html'

console.log("logging out")
res.json(js)

})
app.get('/book/:info',
authenticateToken,
(req, res)=> {
const info = JSON.parse(req.params.info);
console.log(info)

const hotelname = info.hotelname;
const city = info.city;
console.log('cp 1')

const hotels = db.exec('SELECT * FROM hotels')[0];
console.log('cp 2')
if (!hotels) return res.json({
"error": "no hotels found"
})
console.log('cp 3')
const target = hotels.values.find(hotel => hotel[1] === hotelname && hotel[4] === city);
if (!target) return res.json({
error: 'hotel not found'
});

console.log('cp 4')
const theuser = req.user;
const ownername = target[9];

const admins = db.exec('SELECT * FROM admins')[0];
if (!admins) return res.json({
'message ': 'error somethig is wrong'
});
console.log('cp 5')
console.log(ownername)

const admin = admins.values.find(owner => owner[1] == ownername);
if (!admin) return res.json({
'message': 'failed'
});
console.log('cp 6')
const adminid = admin[0]
console.log('adminid is '+adminid)
console.log('adminid is'+admin[0]+'hotel owner'+hotels[9])


if (!admin) return res.json({
'message': 'no admin found with this name'
});

const users = db.exec('SELECT * FROM users')[0];
if (!users) return res.json({
"error": 'no users found'
})

const verifyUser = users.values.find(user => user[0] === req.user.id && user[1] === req.user.username);
if (!verifyUser) return res.json({
error: 'user not found'
});
if (verifyUser[0] !== theuser.id || verifyUser[1] !== req.user.username)return res.json({
"error": 'ERROR 403'
})

const bookdate = new Date();
const enddate = new Date(bookdate.getTime()+24*60*60*1000);
const startstring = bookdate.toISOString();
const endstring = enddate.toISOString();
const day = bookdate.getDate();
console.log(bookdate)
console.log(enddate)
/*bookings(id INTEGER PRIMARY KEY AUTOINCREMENT,userid INTEGER ,adminid INTEGER,hotelname TEXT,username TEXT,price DOUBLE,date_start TEXT ,date_end TEXT,state TEXT)*/
const state = false;
const price = target[3]+0.4;
console.log(theuser.id +'-'+adminid+'-'+info.hotelname+'-'+theuser.username+'-'+target[3]+'-'+bookdate+'-'+enddate+'-'+state);

console.log(typeof(state))
console.log(typeof(price))
const addboobking = db.run('INSERT INTO bookings (userid,adminid,hotelname,username,price,date_start,date_end,state) VALUES (?,?,?,?,?,?,?,?);', [theuser.id, adminid, hotelname, theuser.username, price, startstring, endstring, state]);

const listall = db.exec('SELECT*FROM bookings')[0].values;
console.log(listall)










res.json('booked :{'+JSON.stringify(info)+'}')
saveDb();

})

app.get('/mybookings',
authenticateToken,
(req, res)=> {


const my_booking_list = db.exec('SELECT * FROM bookings')[0];

if (!my_booking_list)return res.json('no bookings found')

const bookings = my_booking_list.values.find(bookings => bookings[1] == req.user.id && bookings[4] == req.user.username)

if (!bookings) return res.json('no reserved bookings found!')

res.json(bookings)
})

app.get('/bookings',
authenticateToken,
isAdmin,
(req, res)=> {
console.log('bookings route')
const adminbookings = db.exec('SELECT * FROM bookings')[0];

if (!adminbookings) return res.json({
error: 'bookings are empty'
})

console.log(adminbookings)

const this_admin_bookings = adminbookings.values.filter(bookings => bookings[2] == req.user.id)
console.log('user is'+ req.user.username)
if (!this_admin_bookings) return res.json({
message: 'no bookings yet'
})


console.log(this_admin_bookings)
res.json(this_admin_bookings)

})

app.get('/user_profile',
authenticateToken,
(req, res)=> {

res.json({
"username": req.user.username
})

})






app.listen(process.env.PORT,
() => {
console.log(`Server is up on port ${process.env.PORT}.`);

});
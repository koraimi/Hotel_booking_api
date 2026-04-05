const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')

let db;
let saveDb;
function setDb(database,save) { db = database
saveDb = save
}

router.get('/findHotels', authenticateToken, (req, res,next) => {
try{
const hotels = db.exec("SELECT * FROM hotels")[0];
if (!hotels) return res.json({ error: 'no hotels found' })
let arr = [];
hotels.values.forEach(hot => {
let js = {};
js.hotelname = hot[1];
let photos = JSON.parse(hot[7]);
js.img = photos[0];
arr.push(js)
})
res.json(arr)
}catch(err){
next(err);
}
})

router.get('/hotel/:h', authenticateToken, (req, res,next) => {
try{
const name = req.params.h;
const hotels = db.exec("SELECT * FROM hotels")[0]
if (!hotels) return res.send('no hotel found')
const thehotel = hotels.values.find(h => h[1] === name);
if (!thehotel) return res.send('no hotel found')
res.json(thehotel);
}catch(err){
next(err);
}
})

router.get('/book/:info', authenticateToken, (req, res,next) => {
try{
const info = JSON.parse(req.params.info);
const { hotelname, city } = info;
const hotels = db.exec('SELECT * FROM hotels')[0];
if (!hotels) return res.json({ error: "no hotels found" })
const target = hotels.values.find(h => h[1] === hotelname && h[4] === city);
if (!target) return res.json({ error: 'hotel not found' });
const ownername = target[9];
const admins = db.exec('SELECT * FROM admins')[0];
if (!admins) return res.json({ message: 'error something is wrong' });
const admin = admins.values.find(o => o[1] == ownername);
if (!admin) return res.json({ message: 'failed' });
const adminid = admin[0];
const users = db.exec('SELECT * FROM users')[0];
if (!users) return res.json({ error: 'no users found' })
const verifyUser = users.values.find(u =>
u[0] === req.user.id && u[1] === req.user.username);
if (!verifyUser) return res.json({ error: 'user not found' });
const bookdate = new Date();
const enddate = new Date(bookdate.getTime() + 24 * 60 * 60 * 1000);
const state = false;
const price = target[3] + 0.4;
db.run('INSERT INTO bookings (userid,adminid,hotelname,username,price,date_start,date_end,state) VALUES (?,?,?,?,?,?,?,?);',
[req.user.id, adminid, hotelname, req.user.username, price,
bookdate.toISOString(), enddate.toISOString(), state]);
saveDb()
res.json({ message: 'booked', info: info })
// saveDb will be called from server.js
}catch(err){
next(err);
}
})

module.exports = { router, setDb }
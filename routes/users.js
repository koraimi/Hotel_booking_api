const express = require('express')
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const { authenticateToken } = require('../middleware/auth')

let db;
function setDb(database) { db = database }

router.post('/register', async (req, res) => {
const user = req.body;
const compare = db.exec('SELECT * FROM users')[0];
if (compare) {
const found = compare.values.find(item => item[1] == user.username)
if (found) {
return res.send("user already exists try again")
} else {
const hashed = await bcrypt.hash(user.password, 10);
db.run("INSERT INTO users (username, password) VALUES (?, ?);",
[user.username, hashed]);
return res.send("registered success")
}
} else {
const hashed = await bcrypt.hash(user.password, 10);
db.run("INSERT INTO users (username, password) VALUES (?, ?);",
[user.username, hashed]);
return res.send("registered success")
}
})

router.post('/login', async (req, res) => {
const data = req.body
const listofUsers = db.exec("SELECT * FROM users")[0];
if (listofUsers) {
const rows = listofUsers.values;
let isuser = false;
let user = {};
for (const item of rows) {
const passwordMatch = await bcrypt.compare(data.password, item[2]);
if (item[1] == data.username && passwordMatch) {
user = item;
user.id = item[0]
isuser = true
break;
}
}
if (isuser) {
const token = jwt.sign({
id: user.id,
username: data.username,
role: "user"
}, process.env.SECRET_KEY, { expiresIn: '1h' });
return res.json({
username: data.username,
token: token,
url: 'Main.html'
})
} else {
return res.status(400).json({ message: "wrong username or password" })
}
} else {
return res.status(401).json({ message: "no users found" })
}
})

router.get('/logout', authenticateToken, (req, res) => {
res.json({ action: "logout", url: 'login.html' })
})

router.get('/mybookings', authenticateToken, (req, res) => {
const my_booking_list = db.exec('SELECT * FROM bookings')[0];
if (!my_booking_list) return res.json('no bookings found')
const bookings = my_booking_list.values.find(b =>
b[1] == req.user.id && b[4] == req.user.username)
if (!bookings) return res.json('no reserved bookings found!')
res.json(bookings)
})

router.get('/user_profile', authenticateToken, (req, res) => {
res.json({ username: req.user.username })
})

module.exports = { router, setDb }
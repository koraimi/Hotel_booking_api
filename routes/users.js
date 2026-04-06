const express = require('express')
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")

const { body, validationResult } = require('express-validator');


const { authenticateToken } = require('../middleware/auth')

let db;
function setDb(database) { db = database }

const SECRET_KEY = process.env.SECRET_KEY;

router.post('/register', [body('username').notEmpty().withMessage('Invalid username'), body('password').isLength({min: 8 }).withMessage('password must be 8 or more')], async (req, res,next) => {
try{
const user = req.body;
const errors = validationResult(req);

if (!errors.isEmpty()) {
return res.status(400).json({
errors: errors.array()
});
}
const compare = db.exec('SELECT * FROM users')[0];
if (compare && compare.values ) {
const found = compare.values.find(item => item[1] == user.username)
if (found) {
return res.send("user already exists try again")
} else {
const hashed = await bcrypt.hash(user.password, 10);
db.run("INSERT INTO users (username, password) VALUES (?, ?);",
[user.username, hashed]);
return res.json({message: "registered success"})
}
} else {
const hashed = await bcrypt.hash(user.password, 10);
db.run("INSERT INTO users (username, password) VALUES (?, ?);",
[user.username, hashed]);
return res.json({message: "registered success"})
}
}catch(err){

next(err);
}
})

router.post('/login', [body('username').notEmpty().withMessage('Invalid username'), body('password').notEmpty().withMessage('please enter a valid password')], async (req, res,next) => {
try{
const data = req.body

const errors = validationResult(req);

if (!errors.isEmpty()) {
return res.status(400).json({
errors: errors.array(),
});
}
const listofUsers = db.exec("SELECT * FROM users")[0];
if (!listofUsers || !listofUsers.values) {
return res.status(404).json({ message: "no users found" });
}


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
auth: token,
url: 'Main.html'
})
} else {
return res.status(400).json({ message: "wrong username or password" })
}


}catch(err){
next(err);
}
})


router.get('/logout', authenticateToken, (req, res,next) => {
try{
res.json({ action: "logout", url: 'login.html' })
}catch(err){
next(err);
}
})

router.get('/mybookings', authenticateToken, (req, res,next) => {
try{
const my_booking_list = db.exec('SELECT * FROM bookings')[0];
if (!my_booking_list) return res.json('no bookings found')
const bookings = my_booking_list.values.filter(b =>
b[1] == req.user.id && b[4] == req.user.username)
if (bookings.length === 0) return res.json('no reserved bookings found!')
res.json(bookings)
}catch(err){
next(err);
}
})

router.get('/user_profile', authenticateToken, (req, res,next) => {
try{
res.json({ username: req.user.username })
}catch(err){
next(err);
}
})

module.exports = { router, setDb }
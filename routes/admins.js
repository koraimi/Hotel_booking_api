const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const { authenticateToken, isAdmin } = require('../middleware/auth')

const SECRET_KEY = process.env.SECRET_KEY;

const upload = multer({
storage: multer.diskStorage({
destination: 'uploads/',
filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
})
});

let db;
function setDb(database) { db = database }

router.post('/adminlog', async (req, res) => {
const us = req.body;
console.log('test')
const dbres = db.exec('SELECT * FROM admins')[0];
if (!dbres) return res.status(404).json({ message: "no admins yet" })
let isfound = false;
let user = {};
for (const item of dbres.values) {
const passwordMatch = await bcrypt.compare(us.password, item[2]);
if (item[1] == us.username && passwordMatch) {
isfound = true;
user = item;
user.id = item[0]
break;
}
}
if (!isfound) return res.status(400).json({ message: "not found" })
const token = jwt.sign({
id: user.id,
username: us.username,
role: 'admin'
}, process.env.SECRET_KEY, { expiresIn: '1h' });
res.json({ text: "found admin", auth: token, url: 'admin_main.html' })
})

router.post('/admin-register-user', async (req, res) => {
const usd = req.body;
const dbret = db.exec('SELECT * FROM admins')[0];
if (dbret) {
const found = dbret.values.find(u => u[1] == usd.username)
if (!found) {
const hashed = await bcrypt.hash(usd.password, 10);
db.run('INSERT INTO admins(username,password) VALUES(?,?);',
[usd.username, hashed]);
return res.send("registered")
} else {
return res.send("username already taken")
}
} else {
const hashed = await bcrypt.hash(usd.password, 10);
db.run('INSERT INTO admins(username,password) VALUES(?,?);',
[usd.username, hashed]);
return res.send("first admin registered")
}
})

router.post('/upload', authenticateToken, isAdmin,
upload.array("images"), (req, res) => {
const data = req.body;
const imageurs = req.files.map(file => `/uploads/${file.filename}`);
const admin = db.exec('SELECT * FROM admins')[0];
if (!admin) return res.send("error 404");
const owner = req.user.username;
const match = admin.values.find(l => l[1] === owner);
if (match) {
let type = JSON.stringify(imageurs)
db.exec('INSERT INTO hotels(hotelname,rooms,price,city,phone,email,photos,location,owner) VALUES(?,?,?,?,?,?,?,?,?);',
[data.hotelname, data.rooms, data.price, data.city,
data.phone, data.email, type, data.loc, owner]);
return res.send("uploaded success")
} else {
return res.status(403).json({ message: "no admin found" });
}
})

router.get('/admin_profile', authenticateToken, isAdmin, (req, res) => {
const owner = req.user.username;
const admins = db.exec("SELECT * FROM admins")[0]
if (!admins) return res.send('no admins yet')
const match = admins.values.find(a => a[1] === owner);
if (!match) return res.send('unauthorised')
const hotel_list = db.exec('SELECT * FROM hotels')[0];
if (!hotel_list) return res.send('no hotels found')
const target = hotel_list.values.find(h => h[9] === owner);
if (!target) return res.send("no hotel found")
const photos = JSON.parse(target[7]);
let imges = photos.map(img => `<img src="${img}"></img>`).join('')
const html = `
<h1>hotelname ${target[1]}</h1>
<h3>total rooms ${target[2]}</h3>
<p>price ${target[3]}</p>
<p>city ${target[4]}</p>
<div>${imges}</div>
`;
res.send(html)
})

router.get('/adminpanel', authenticateToken, isAdmin, (req, res) => {
const admins = db.exec("SELECT * FROM admins")[0];
if (admins) {
return res.send('hotelinfo.html');
} else {
return res.status(403).json({ message: 'no admins found' });
}
})

router.get('/bookings', authenticateToken, isAdmin, (req, res) => {
const adminbookings = db.exec('SELECT * FROM bookings')[0];
if (!adminbookings) return res.json({ error: 'bookings are empty' })
const this_admin_bookings = adminbookings.values.filter(b => b[2] == req.user.id)
res.json(this_admin_bookings)
})

router.get('/logoutadmin', authenticateToken, isAdmin, (req, res) => {
res.json({ action: "logout", url: 'adminlogin.html' })
})

module.exports = { router, setDb }
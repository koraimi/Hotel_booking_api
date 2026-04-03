const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY;
function authenticateToken(req, res, next) {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

if (!token) return res.status(401).json({
message: 'No Token'
});

jwt.verify(token, SECRET_KEY, (err, user) => {
if (err) return res.status(403).json({
message: 'invalid token'
});
req.user = user; // Add user info to request

next();
});
}
function isAdmin(req, res, next) {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
if (!token) return res.status(401).json({
'message ': 'token error'
});


if (req.user.role !== "admin")return res.status(403).send('403')
jwt.verify(token, SECRET_KEY, (err, user) => {
if (err) return res.status(403).json({
message: 'invalid token'
});
req.user = user; // Add user info to request
next()
})

}

module.exports = { authenticateToken, isAdmin }
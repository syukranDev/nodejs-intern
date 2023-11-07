const jwt = require('jsonwebtoken')
const secretKey = 'nodejsIntern' //Normally we saved this in config file but I'll just put it here.


function verifyToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided' });
    }
  
    console.log({token, secretKey})
    const splitToken = token.split(' ')[1]
    jwt.verify(splitToken, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Please relogin to retrieve the new token.' });
      }
  
      req.decodedToken = decoded;
      next();
    });
  }

  module.exports = {
    verifyToken,
};
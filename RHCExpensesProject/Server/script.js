const crypto = require('crypto');

var salt = crypto.randomBytes(20).toString('hex');

var hashpass = crypto.createHmac('sha512', 'Philosophy337').update(salt).digest('bin');
console.log(crypto.getHashes())

console.log(salt);
console.log(salt.length);
console.log(hashpass.length);
'use strict'

//This function returns a hashed password from a salt and password.
module.exports = 
{
    hashPassword: function(salt, pass)
    {
        const crypto = require('crypto');
        return crypto.createHmac('sha512', pass)
        .update(salt)
        .digest('hex');
    }
}
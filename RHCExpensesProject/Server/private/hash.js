'use strict'

const crypto = require('crypto');

module.exports = 
{
    //This function returns a hashed password from a salt and password.
    hashPassword: function(salt, pass)
    {
        return crypto.createHmac('sha512', pass)
        .update(salt)
        .digest('hex');
    },

    //This function returns a hashed password from a salt and password.
    createSalt: function()
    {
        return crypto.randomBytes(20).toString('hex');
    }

}
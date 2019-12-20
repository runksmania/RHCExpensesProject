'use strict'
const nodemailer = require('nodemailer');
const logger = require('../private/logger');

module.exports = class Mailer
{
    constructor()
    {

        this.transporter = nodemailer.createTransport(
            {
                host: 'mail.michaelcottrell.net',
                port: 465,
                secure: false,
                auth:
                {
                    user: 'email@michaelcottrell.net',
                    pass: '$HCXui?J]m.a'
                }

            });

        this.transporter.verify(function (err, success)
        {
            if (err)
            {
                logger.error(err);
            }
            else
            {
                logger.info('Connection to email server successful.');
            }
        });
    }
}

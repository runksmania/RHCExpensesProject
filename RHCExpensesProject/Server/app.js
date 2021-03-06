'use strict';

/**
 * Import Classes.
 */
const databaseHandler = require('./private/DatabaseHandler');
const logger = require('./private/logger');
const Constants = require('./private/Constants');
const hash = require('./private/hash');
const zipcodes = require('zipcodes');
//const Mailer = require('./private/mailer');

/**
* Instantiate Classes.
*/
const constants = new Constants();
const dbhandler = new databaseHandler();
//const mailer = new Mailer();

/**
 * Program Dependencies.
 */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const { body } = require('express-validator');
const { sanitizeBody } = require('express-validator');
var flash = require('connect-flash');

/**
 *
 *
 * App setup.
 *
 *
 */
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({

    name: 'session',
    secret: ['256a9ae4fdd162057d57ced6ab92364e80f2192e',
        '09fff925f85c1cbcfd8e4253f529e9c86e016d79',
        '6d82f4dad615e281ad5a66962b18235848328c4c',
        '8c4ebb0d757847a26563fa83b0404b16acf008d9',
        '6f2ab0cb1fa0b14c7d34c53f28bbf9be2510868b',
        '4b537365299488fb980c33fc0e96411872fb03c7',
        'dcf4c762ec035acc5094eb3c8e0e8ec9ac1700fa',
        '7aed3340f1511c72caf3512ffdbd75e1a8abeaab',
        '77efceadd5ef67f798f7c1f13e74344ee69dcf3c'
    ],
    secure: true,
    resave: false,
    saveUninitialized: true,
    cookie: { sameSite: 'lax' },
}));

app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * 
 * 
 * Begin app.gets
 * 
 * 
 */

app.get('/', (req, res) =>
{
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if (req.session.flash)
    {
        var flash = req.flash('info');
        var message = req.flash(flash);
        req.session.flash = null;
        logger.info(message);

        if(req.session.user)
        {
            logger.info(req.session.user.username)
        }

        res.render('flash', { flashTitle: flash.toString(), flashMessage: message.toString() });
    }
    else if (req.session && req.session.user)
    {
        res.redirect('/main');
    }
    else 
    {
        req.session.destroy();
        res.render('login');
    }
});

app.get('/login', (req, res) =>
{
    res.redirect('/');
});

app.get('/resetPassword', (req, res) =>
{
    if (req.session && req.session.user)
    {
        res.render('resetPassword', {failed: false});
    }
    else
    {
        res.redirect('/');
    }

});

app.get('/main', (req, res) =>
{
    if (req.session && req.session.user)
    {
        let data = { name: req.session.user.name, accessToken: req.session.user.accessToken };

        if (req.session.user.resetPass == true)
        {
            res.redirect('/resetPassword');
        }

        res.render('main', data);
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/requestMaterials', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        res.render('requestMaterials');
    }
    else
    {
        res.redirect('/');
    }

});

app.get('/main/viewPendingRequests', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.viewPendingRequests(req.session.user.id, function (err, result)
        {
            if (err)
            {
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                for (var i = 0; i < result.length; i++)
                {
                    //Remove parts of the result that won't go in the table, and the client doesn't need to see.
                    delete result[i].idmaterial_request;
                    delete result[i].requester_id;
                    delete result[i].manager_id;
                    delete result[i].planner_id;
                    delete result[i].fulfiller_id;
                    delete result[i].deleted;
                    delete result[i].deleted_by;
                    delete result[i].deleted_time;

                    if (result[i].thaw_required == 1)
                    {
                        result[i].thaw_required = 'Yes';
                    }
                    else
                    {
                        result[i].thaw_required = 'No';
                    }

                    for (var property in result[i])
                    {
                        if (result[i][property] == null || result[i][property] == '')
                        {
                            result[i][property] = 'N/A';
                        }
                    }
                }

                logger.info(result);

                res.render('viewRequests', { type: 'Pending', result: result });
            }
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/alterRequests', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.accessToken < 6  && req.session.user.resetPass != true)
    {
        dbhandler.viewPendingRequests(req.session.user.id, function (err, result)
        {
            if (err)
            {
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                for (var i = 0; i < result.length; i++)
                {
                    //Remove parts of the result that won't go in the table, and the client doesn't need to see.
                    delete result[i].requester_id;
                    delete result[i].manager_id;
                    delete result[i].planner_id;
                    delete result[i].fulfiller_id;
                    delete result[i].deleted;
                    delete result[i].deleted_by;
                    delete result[i].deleted_time;

                    if (result[i].thaw_required == 1)
                    {
                        result[i].thaw_required = 'Yes';
                    }
                    else
                    {
                        result[i].thaw_required = 'No';
                    }

                    for (var property in result[i])
                    {
                        if (result[i][property] == null || result[i][property] == '')
                        {
                            result[i][property] = 'N/A';
                        }
                    }
                }

                res.render('alterRequests2', { result: result });
            }
        });
    }
    else
    {
        res.redirect('/');
    }

});

app.get('/main/reviewPendingRequests', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.accessToken < 5 && req.session.user.resetPass != true)
    {
        dbhandler.viewPendingRequests(req.session.user.id, function (err, result)
        {
            if (err)
            {
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                logger.info(typeof (result[0].requested_time));
                logger.info(result[0].requested_time.date);
                for (var i = 0; i < result.length; i++)
                {
                    //Remove parts of the result that won't go in the table, and the client doesn't need to see.
                    delete result[i].idmaterial_request;
                    delete result[i].requester_id;
                    delete result[i].manager_id;
                    delete result[i].planner_id;
                    delete result[i].fulfiller_id;
                    delete result[i].deleted;
                    delete result[i].deleted_by;
                    delete result[i].deleted_time;

                    //Change request date to better format.
                    //result[i][requested_time] = result[i][requested_time].slice(0, 12)

                    if (result[i].thaw_required == 1)
                    {
                        result[i].thaw_required = 'Yes';
                    }
                    else
                    {
                        result[i].thaw_required = 'No';
                    }

                    for (var property in result[i])
                    {
                        if (result[i][property] == null || result[i][property] == '')
                        {
                            result[i][property] = 'N/A';
                        }
                    }
                }

                res.render('reviewPendingRequests', { result: result });
            }
        });
    }
    else
    {
        res.redirect('/');
    }

});

app.get('/main/recentRequests', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.viewRecentRequests(function (err, result)
        {
            if (err)
            {
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                for (var i = 0; i < result.length; i++)
                {
                    //Remove parts of the result that won't go in the table, and the client doesn't need to see.
                    delete result[i].idmaterial_request;
                    delete result[i].requester_id;
                    delete result[i].manager_id;
                    delete result[i].planner_id;
                    delete result[i].fulfiller_id;
                    delete result[i].deleted;
                    delete result[i].deleted_by;
                    delete result[i].deleted_time;

                    if (result[i].thaw_required == 1)
                    {
                        result[i].thaw_required = 'Yes';
                    }
                    else
                    {
                        result[i].thaw_required = 'No';
                    }

                    for (var property in result[i])
                    {
                        if (result[i][property] == null || result[i][property] == '')
                        {
                            result[i][property] = 'N/A';
                        }
                    }
                }

                res.render('viewRequests', { type: 'Recent', result: result });
            }
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/searchRequests', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        res.render('search');
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/addNewVendor', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        res.render('addNewVendor');
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/vendors', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.vendorQuery({}, function (err, result)
        {
            if (err)
            {
                logger.error('Error while navigating to vendors page:\n');
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                res.render('vendors', {'vendors' : result.rows});
            }
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/items', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.specificVendorItemQuery({}, 0, function (err, result)
        {
            if (err)
            {
                logger.error('Searching all items:\n' + req.params.vName);
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else 
            {
                res.render('items', {'vName' : 'All', 'vId' : '', 'items' : result.rows});
            }
        });
    }
    else 
    {
        res.redirect('/');
    }   
});

app.get('/main/vendors/id/:vId/Name/:vName', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.specificVendorItemQuery({'narrow' : ''}, req.params.vId, function (err, result)
        {
            if (err)
            {
                logger.error('Searching items from vendor and navigating to items:\n' + req.params.vName);
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                res.render('items', {'vName': req.params.vName, 'vId': req.params.vId, 'items' : result.rows});
            }         
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/vendors/search/?*', [body('query.search').trim().escape()], (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.vendorQuery(req.query, function (err, result)
        {
            if (err)
            {
                logger.error('Error when searching vendors:\n' + req.query);
                logger.error(err);
                res.send([]);
            }
            else
            {
                res.send(result.rows);
            }
        });
    }
    else
    {
        res.send([]);
    }
});

app.get('/items/search/vendor/:vId', (req, res) => 
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.specificVendorItemQuery(req.query, req.params.vId, function (err, result)
        {
            if (err)
            {
                logger.error('Error when searching items by vendor:\n' + req.params.vName);
                logger.error(err);
                res.send([])
            }
            else
            {
                res.send(result.rows);
            }
        });
    }
    else
    {
        res.send([]);
    }
});

app.get('/main/addItem', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.vendorQuery({}, function(err, result)
        {
            if (err)
            {
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');
            }
            else
            {
                result = result.rows;
                var vendNumArr = [];
                var vendArr = [];
    
                for (var i = 0; i < result.length; i++)
                {
                    vendNumArr.push(result[i].vendor_id);
                    vendArr.push(result[i].vendor_name);
                }

                res.render('addItem', {'vendNumArr' : vendNumArr, 'vendArr' : vendArr});
            }
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/main/admin/addNewUser', (req, res) =>
{
    var adminRights = false;

    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        if (req.session.user.accessToken < 2 && req.session.user.accessToken >= 0)
        {
            adminRights = true;
        }

    }

    if (adminRights == true)
    {
        dbhandler.deptQuery( function(err, result)
        {
            result = result.rows;
            var deptNumArr = [];
            var deptArr = [];

            for (var i = 0; i < result.length; i++)
            {
                deptNumArr.push(result[i].dept_num);
                deptArr.push(result[i].dept_name);
            }

            res.render('addNewUser', {'deptNumArr' : deptNumArr, 'deptArr' : deptArr});
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('*/logout', (req, res) =>
{
    req.session.destroy();
    res.redirect('/');
});

app.get('/password=forgot', (req, res) =>
{
    res.render('forgot', { forgot: 'password' });
});

app.get('/username=forgot', (req, res) => 
{
    res.render('forgot', { forgot: 'username' });
});

/************************************************************************************
 ************************************************************************************ 
 ************************************************************************************ 
 ******************************* BEGIN APP.POSTS ************************************
 ************************************************************************************
 ************************************************************************************
 ************************************************************************************
 ************************************************************************************/

app.post('/login', [body('username').trim().escape()], (req, res) =>
{
    var user;

    dbhandler.attemptLogin(req.body.username, req.body.password, function (err, result)
    {
        if (err)
        {
            logger.error('Therer was an error attempting to login:\n' + req.body.username);
            logger.error(err);
            var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                + ' should this issue persist.';
            req.flash('info', 'requestError');
            req.flash('requestError', flashMessage);
            res.redirect('/');
        }
        else 
        {
            user = result;

            if (user == null)
            {
                res.render('loginFailed');
            }
            else
            {
                req.session.user = user;
                user.resetPass == false ? res.redirect('/main') : res.redirect('/resetPassword')
            }
        }
    });

});

app.post('/main/admin/addNewUser', (req, res) =>
{
    if (!req.session && !req.session.user && !req.session.user.accessToken < 2 && !req.session.user.accessToken >= 0)
    {
        if (req.session && req.session.user)
        {
            res.redirect('/main');
        }
        else
        {
            res.redirect('/');
        }
    }

    logger.info(req.session.user.username + ' is creating a user for: ' + req.body.username);

    dbhandler.addNewUser(req.body.empId, req.body.username, req.body.fname, req.body.lname, req.body.dept, req.body.email,
        req.body.password, req.body.accessToken, function (err, bool)
    {
        if (err)
        {
            logger.error('Therer was an error attempting to add new user:\n' + req.body);
            logger.error(err);
            var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                + ' should this issue persist.';
            req.flash('info', 'requestError');
            req.flash('requestError', flashMessage);
            res.redirect('/');
        }
        else
        {
            var flashMessage = 'User account was successfully created for user: ' + req.body.fname + ' ' + req.body.lname;
            req.flash('info', 'addSuccess');
            req.flash('addSuccess', flashMessage);
            res.redirect('/');
        }
    });
});

app.post('/main/addNewVendor', (req, res) =>
{
    if (req.session && req.session.user && !req.session.user.resetPass)
    {
        var v = req.body;
        var zip = zipcodes.lookup(v.zip);

        dbhandler.addNewVendor(v.name, v.address, zip.city, zip.state, v.zip, v.terms, function(err, result)
        {
            if (err)
            {
                logger.error('Therer was an error attempting to add a new vendor:\n' + v);
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');          
            }
            else
            {
                res.redirect('/main');
            }
        });
        
    }
    else
    {
        res.redirect('/');
    }
});

app.post('/main/addItem', (req, res) =>
{
    if (req.session && req.session.user && !req.session.user.resetPass)
    {
        var data = req.body;
        data.vId = parseInt(data.vId);
        data.min_quan = data.min_quan == '' ? null : parseInt(data.min_quan);
        data.max_quan = data.max_quan == '' ? null : parseInt(data.max_quan);

        dbhandler.addItem(data.name, data.vId, data.price, data.desc, data.min_quan, data.max_quan, function (err, result)
        {
            if (err)
            {
                logger.error('Therer was an error attempting to add an item:\n' + data);
                logger.error(err);
                var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                    + ' should this issue persist.';
                req.flash('info', 'requestError');
                req.flash('requestError', flashMessage);
                res.redirect('/');          
            }
            else
            {
                res.redirect('/main');
            }

        });
    }
    else
    {
        res.redirect('/');
    }
});

app.post('/pasword=forgot*', [body('username').trim().escape()], (req, res) =>
{
    mailer.sendMail('password', userInfo.username, function (err, result)
    {
        if (err)
        {
            logger.error('Therer was an error attempting to send reset password email:\n' + userInfo);
            logger.error(err);
            var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                + ' should this issue persist.';
            req.flash('info', 'requestError');
            req.flash('requestError', flashMessage);
            res.redirect('/');
        }
        else
        {
            req.flash('info', 'passwordForgot');
            req.flash('passwordForgot', 'A notification email has been sent to your administrator.'
                + 'They will reset your password and provide you with a new one.');
            res.redirect('/');
        }
    });
});

app.post('/username=forgot*', [body('email').trim().escape], (req, res) =>
{
    mailer.sendMail('username', req.body.username, function (err, result)
    {
        if (err)
        {
            logger.error(err);
            var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                + ' should this issue persist.';
            req.flash('info', 'requestError');
            req.flash('requestError', flashMessage);
            res.redirect('/');
        }
        else
        {
            req.flash('info', 'usernameForgot');
            req.flash('usernameForgot', 'A email has been sent to the email address'
                + ' you provided with your username.');
            res.redirect('/');
        }
    });
});

app.post('/resetPassword', (req, res) =>
{
    if (req.session && req.session.user)
    {
        var user = req.session.user;

        if (user.firstLogin || user.resetPass)
        {
            dbhandler.prevPassQuery(user.username, req.body.pass, function(error, result)
            {  
                if (result.length == 0)
                {
                
                    dbhandler.resetPassword(user.username, req.body.pass, function(err, bool)
                    {
                        if(err)
                        {
                            logger.error('Therer was an error attempting to reset password:\n' + user.username);
                            logger.error(err);
                            var flashMessage = 'There was an error processing that request. Please try again or contact an administrator'
                                + ' should this issue persist.';
                            req.flash('info', 'requestError');
                            req.flash('requestError', flashMessage);
                            res.redirect('/');

                        }
                        else
                        {
                            req.flash('info', 'passwordReset');
                            req.flash('passwordReset', 'Your password has been reset');
                            req.session.user.resetPass = false;
                            res.redirect('/');
                        }
                    })
                }
                else
                {
                    res.render('resetPassword', {failed: true});
                }
            });
        }
        else
        {
            res.redirect('/main');
        }
    }
    else
    {
        res.redirect('/');
    }
});

/************************************************************************************
 ************************************************************************************ 
 ************************************************************************************ 
 ******************************* BEGIN APP.PUTS *************************************
 ************************************************************************************
 ************************************************************************************
 ************************************************************************************
 ************************************************************************************/

app.put('/items/update', (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
        dbhandler.updateItems(req.body.data, function (err, result)
        {
            if (err)
            {
                logger.error('Error when searching items by vendor:\n' + req.params.vName);
                logger.error(err);
                res.send([])
            }
            else
            {
                res.send(result.rows);
            }
        });
    }
    else
    {
        res.send([]);
    }
});

app.use((req, res) =>
{
    res.redirect('/');
});

app.listen(constants.port, constants.host, () =>
{
    logger.info('Connected to database successfully.');
    logger.info('Server is now listening on: ' + constants.host + ':' + constants.port);
});

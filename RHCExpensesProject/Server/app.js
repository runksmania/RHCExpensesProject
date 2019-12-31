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

app.get('/main/searchRequests/?*', [body('query.search').trim().escape()], (req, res) =>
{
    if (req.session && req.session.user && req.session.user.resetPass != true)
    {
            logger.info(req.session.user.username + ' searches for requests matching: ' + req.query.search);

        dbhandler.searchRequests(req.query.search, function (err, result)
        {
            if (err)
            {
                logger.error(err);
                res.send(null);
            }
            else
            {
                if (result)
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

                        //Change value to string to render on table.
                        if (result[i].thaw_required == 1)
                        {
                            result[i].thaw_required = 'Yes';
                        }
                        else
                        {
                            result[i].thaw_required = 'No';
                        }

                        //Change empty null values to N/A for better readability on table.
                        for (var property in result[i])
                        {
                            if (result[i][property] == null || result[i][property] == '')
                            {
                                result[i][property] = 'N/A';
                            }
                        }
                    }

                }
                else
                {
                    result = null;
                }

                res.send(result);
            }

        });
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

/**
 * 
 * 
 * Begin app.post
 * 
 * 
 * 
 */

app.post('/login', [body('username').trim().escape()], (req, res) =>
{
    var user;

    dbhandler.attemptLogin(req.body.username, req.body.password, function (err, result)
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

app.post('/main/requestMaterials',
    [
        body('matId').escape(),
        body('description').escape(),
        body('comment').escape(),
        body('quantity').escape(),
        body('uom').escape(),
        body('batchNum').escape(),
        body('source').escape(),
        body('destination').escape(),
        body('transNum').escape(),
        body('thawReq').escape(),
        body('refreezeDate').escape(),
        body('dateReq').escape()
    ],
    (req, res) =>
    {

        if (!req.session && !req.session.user)
        {
            res.redirect('/');
        }

        var matId = req.body.matId,
            description = req.body.description,
            comment = req.body.comment,
            quantity = req.body.quantity,
            uom = req.body.uom,
            batchNum = req.body.batchNum,
            source = req.body.source,
            destination = req.body.destination,
            transNum = req.body.transNum,
            thawReq = req.body.thawReq,
            refreezeDate = req.body.refreezeDate,
            dateReq = req.body.dateReq,
            requestor = req.session.user.name,
            requestorId = req.session.user.id;

        if (thawReq == null)
        {
            thawReq = '0';
        }

        dbhandler.requestMaterials(matId, description, comment, quantity, uom, batchNum, source, destination,
            transNum, thawReq, refreezeDate, dateReq, requestor, requestorId, function (err, result)
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
                    req.flash('info', 'requestSuccess');
                    req.flash('requestSuccess', 'Material request was successful');
                    res.redirect('/');
                }
            });
    });

app.post('/main/alterRequests/?*',
    [
        body('form[1].value').trim().escape(),
        body('form[2].value').trim().escape(),
        body('form[3].value').trim().escape(),
        body('form[4].value').trim().escape(),
        body('form[5].value').trim().escape(),
        body('form[6].value').trim().escape(),
        body('form[7].value').trim().escape(),
        body('form[8].value').trim().escape(),
        body('form[9].value').trim().escape(),
        body('form[10].value').trim().escape(),
        body('form[11].value').trim().escape(),
        body('form[12].value').trim().escape(),
        body('form[13].value').trim().escape()
    ],
    (req, res) =>
    {
        logger.debug(req.body.form);

        dbhandler.alterRequest(req.session.user.id, req.session.user.name, req.session.user.accessToken, req.body.form, function (err, result)
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
                res.send(result);
            }
        });
    });

app.post('/main/reviewPendingRequests', (req, res) =>
{
    if (!req.session && !req.session.user)
    {
        res.redirect('/');
    }
});

app.post('/main/recentRequests', (req, res) =>
{
    if (!req.session && !req.session.user)
    {
        res.redirect('/');
    }
});

app.post('/main/searchRequests', (req, res) =>
{
    if (!req.session && !req.session.user)
    {
        res.redirect('/');
    }
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

app.use((req, res) =>
{
    res.redirect('/');
});

app.listen(constants.port, constants.host, () =>
{
    logger.info('Server is now listening on: ' + constants.host + ':' + constants.port);
});

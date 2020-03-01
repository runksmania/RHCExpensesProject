'use strict';

/**
 * Module Dependencies.
 */
const {Pool, Client} = require('pg');
const logger = require('../private/logger');
const User = require('../private/User');
const hash = require('../private/hash.js')

module.exports = class DatabaseHandler
{
    constructor()
    {
        this.pool = new Pool(
            {
                host: 'localhost',
                user: 'postgres',
                database: 'rhc',
                password: '$RHCweb',
                port: 5432
            });

        //Grab connection to make sure database is connected
        this.pool.query('SELECT NOW()', (err, res) =>
        {
            if (err)
            {
                logger.error(err);
            }
            else
            {
                logger.info('Connected to database successfully.');
            }

        });
    }

    //This function returns a user if login information is valid, otherwise returns a null user.
    attemptLogin(username, pass, done)
    {

        this.pool.query('SELECT * FROM emp WHERE username = $1', [username], function (err, result)
        {
            var user = new User();

            if (err)
            {
                //Log error and return null to show login failed.
                logger.error(err);
                return done(err, null);
            }
            else if (result.rows.length == 0)
            {
                //No user found return null to show login failed.
                user = null;
            }
            else
            {
                //Check login credentials, against database.
                result = result.rows[0]
                user.id = result.iduser;
                user.username = result.username;
                user.name = result.fname + ' ' + result.lname;
                user.email = result.email;
                user.accessToken = result.access_token;

                //Todays date - last pass change date / ms in 3 months.
                var passAge = Math.floor((Date.now() - result.pass_age) / (2592000000))
                user.resetPass = (result.first_login == null || passAge >= 3 ? true : false);

                var hashPass = hash.hashPassword(result.salt, pass);

                if (hashPass != result.pass)
                {
                    //Login results failed, set user null to show failed login upon returning.
                    user = null;
                }
            }

            //Log login attempt and result.
            //Then return user.
            logger.info("Login attempt.\nUsername: " + username + "\nSuccess: " + (user != null));
            return done(err, user);
        });
    }

    deptQuery(done)
    {
        var queryString = 'SELECT dept_num, dept_name\n'
            + 'FROM dept\n'
            + 'WHERE has_emp IS NOT NULL;';

        this.pool.query(queryString, function (err, res)
        {
            return done(err, res);
        });
    }

    //This function adds a new user into the database.
    addNewUser(emp_id, username, fname, lname, dept, email, pass, accessToken, done)
    {
        var salt = hash.createSalt();
        var hashPass = hash.hashPassword(salt, pass);

        //Set up parameterized query.
        var queryString = 'INSERT INTO emp\n'
            + 'VALUES\n'
            + '($1,$2,$3,$4,$5,$6,$7,$8,$9);';

        var query = this.pool.query(queryString, [emp_id, username, fname, lname, 
            dept, salt, hashPass, email, accessToken], function (err, result)
        {
            if (!err)
            {
                logger.info('Created new user for user: ' + username);
            }

            return done(err, true);

        });
    }

    //Function to grab salt for resetting password.
    saltQuery(username, done)
    {
        this.pool.query('SELECT salt FROM emp WHERE username = $1', [username], function(err, res)
        {
            return done(err, res.rows);
        });
    }

    //Function to grab prev passwords for user.
    prevPassQuery(username, pass, done)
    {
        this.saltQuery(username, function(err, res)
        {
            if (err)
            {
                return err;
            }

            var hashPass = hash.hashPassword(res[0].salt, pass);

            var queryString = 'SELECT prev_pass\n'
                + 'FROM emp_prev_pass\n'
                + 'WHERE prev_pass = $1 AND emp_num = (\n'
                    + 'SELECT emp_num\n'
                    + 'FROM emp\n'
                    + 'WHERE username = $2\n'
                + ');';

            var tempDbhandler = new DatabaseHandler();

            tempDbhandler.pool.query(queryString, [hashPass, username], function(error, result)
            {
                return done(error, result.rows)
            });

        });
    }

    //This function changes the password in the database for the user.
    resetPassword(username, password, done)
    {
        this.saltQuery(username, function(err,res)
        {
            if(err)
            {
                return err;
            }

            var salt = res[0].salt;
            var tempDbhandler = new DatabaseHandler();
            var hashPass = hash.hashPassword(salt, password);

            var queryString = 'UPDATE emp\n'
                + 'SET pass = $1,\n'
                + 'first_login = 1,\n'
                + 'pass_age = NOW()\n'
                + 'WHERE username = $2;'

            tempDbhandler.pool.query(queryString, [hashPass, username], function(error, result)
            {
                return done(error, result);
            });
        });   
    }

    //This function inserts a new vendor into the database.
    addNewVendor(vName, vAddress, vCity, vState, vZip, payTerms, done)
    {
        var queryString = 'INSERT INTO vendor\n'
            + 'VALUES\n'
            + '('
            + 'DEFAULT,$1,$2,$3,$4,$5,$6'
            + ');';
        
        this.pool.query(queryString, [vName, vAddress, vCity, vState, vZip, payTerms], function(err,res)
        {
            return done(err, res);
        });
    }

    //This function inserts a new item into the database.
    addItem(iName, vId, price, desc, min_quan, max_quan, done)
    {
        var queryString = 'INSERT INTO item\n'
            + 'VALUES\n'
            + '('
            + 'DEFAULT,$1,$2,$3,$4,$5,$6'
            + ');';
        
        this.pool.query(queryString, [iName, vId, price, desc, min_quan, max_quan], function (err, res)
        {
            return done(err, res);
        });
    }

    //This functions grabs all vendors if no options. Query will search for partial matches.
    //Options:
    //  vId:            Search by vendor Id.
    //  vName:          Search by vendor name.
    //  iName:          Search by vendors with item name.
    //  City:           Search by vendors city.
    //  Payment Terms:  Search vendors by payment terms.
    vendorQuery(opts, done)
    {
        if (opts['narrow'] != null)
        {
            var queryString = ''

            switch (opts['narrow'])
            {
                case '':
                    queryString = 'SELECT DISTINCT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v, item i\n'
                        + 'WHERE v.vendor_name ILIKE $1\n'
                            + 'OR i.item_name ILIKE $1\n'
                            + 'OR v.vendor_city ILIKE $1\n'
                            + 'OR v.payment_terms ILIKE $1\n'
                            + 'AND v.vendor_id = i.vendor_id\n';
                    break;

                case '1':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                    + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                    + 'FROM vendor v\n'
                    + 'WHERE v.vendor_id = $1\n';

                case '2':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v\n'
                        + 'WHERE v.vendor_name ILIKE $1\n';
                    break;
                    
                case '3':
                    queryString = 'SELECT DISTINCT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v, item i\n'
                        + 'WHERE i.item_name ILIKE $1\n'
                            + 'AND v.vendor_id = i.vendor_id\n';
                    break;

                case '4':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v\n'
                        + 'WHERE v.vendor_city ILIKE $1\n'
                    break;       
                            
                case '5':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v\n'
                        + 'WHERE v.payment_terms ILIKE $1\n'
                    break;

                default:
                    return done(new Error('No determinable search parameters found.'), null);
                
            }

            queryString += 'ORDER BY vendor_name;'

            this.pool.query(queryString, ['%' + opts['search'] + '%'], function(err, res)
            {
                return done(err, res);
            });
        }
        else
        {
            this.pool.query('SELECT * FROM vendor order by vendor_name;', function(err, res)
            {
                return done(err, res);
            });
        }
    }

    //This functions grabs all items from vendor specified if no options. Query will search for partial matches.
    //Options:
    //  itemId: Search by item id.
    //  iName:  Search by item name.
    //  Price:  Search by item price.
    specificVendorItemQuery(opts, vId, done)
    {
        if (opts['narrow'] != null)
        {
            var queryString = ''

            switch (opts['narrow'])
            {
                case '':

                    //Due to switch and callbacks need to provide a second argument for
                    //  this query to work properly.
                    queryString = 'SELECT item_num, item_name, item_desc, item_price,\n'
                        + 'min_quan, max_quan\n'
                        + 'FROM item\n'
                        + 'WHERE vendor_id = $1 AND item_name ILIKE $2;';
                    Object.assign(opts, {'search': ''});
                    break;

                case '1':
                    queryString = 'SELECT item_num, item_name, item_desc, item_price,\n'
                        + 'min_quan, max_quan\n'
                        + 'FROM item\n'
                        + 'WHERE vendor_id = $1 AND item_num = $2;';
                    break;

                case '2':
                    queryString = 'SELECT item_num, item_name, item_desc, item_price,\n'
                        + 'min_quan, max_quan\n'
                        + 'FROM item\n'
                        + 'WHERE vendor_id = $1 AND item_name ILIKE $2;';
                    break;
                    
                case '3':
                    var nums = opts['search'].split(' ');                    

                    //Change max value by 1 to allow for integer change to be accounted for
                    //  in precise lookup.
                    if (nums[0] === nums[1])
                    {
                        nums[1] = Math.floor(parseInt(nums[1])) + 1; 
                    }

                    queryString = 'SELECT item_num, item_name, item_desc, item_price,\n'
                        + 'min_quan, max_quan\n'
                        + 'FROM item\n'
                        + 'WHERE vendor_id = $1 AND\n'
                            + 'item_price BETWEEN ' + nums[0] + ' AND ' + nums[1] + ';';

                    logger.debug(queryString);
                    break;

                default:
                    return done(new Error('No determinable search parameters found.'), null);
                
            }

            if (opts['narrow'] == '3')
            {
                //Price searching needs its own special query.
                this.pool.query(queryString, [vId], function(err, res)
                {
                    return done(err, res);
                });
            }
            else
            {
                this.pool.query(queryString, [vId, '%' + opts['search'] + '%'], function(err, res)
                {
                    return done(err, res);
                });
            }
        }
        else
        {
            this.pool.query('SELECT v.vendor_id, v.vendor_name, item_num, item_name, item_desc, item_price,\n'
                + 'min_quan, max_quan\n'
                + 'FROM item i, vendor v\n'
                + 'WHERE i.vendor_id = v.vendor_id;',
                function(err, res)
            {
                return done(err, res);
            });
        }
    }

    //This functions updates all items from the give array.
    updateItems(itemsData, done)
    {

        for (var i in itemsData)
        {
            var queryString = 'UPDATE item\n'
                + 'SET item_name = $2, item_desc = $3, item_price = $4, min_quan = $5, max_quan = $6\n'
                + 'WHERE item_num = $1;'
            
            itemsData[i][0] = parseInt(itemsData[i][0])
            itemsData[i][3] = parseFloat(itemsData[i][3])
            itemsData[i][4] = parseInt(itemsData[i][4])
            itemsData[i][5] = parseInt(itemsData[i][5])
            logger.debug(itemsData[i]);

            this.pool.query(queryString, itemsData, function(err, res)
            {
                if(err)
                {
                    return done(err,res)
                }
            });
        }

        this.pool.query('SELECT v.vendor_id, v.vendor_name, item_num, item_name, item_desc, item_price,\n'
                + 'min_quan, max_quan\n'
                + 'FROM item i;',
                function(err, res)
            {
                return done(err, res);
            });
    }
}
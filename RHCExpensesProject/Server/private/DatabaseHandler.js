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
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v, item i\n'
                        + 'WHERE v.vendor_name ILIKE $1\n'
                            + 'OR i.item_name ILIKE $1\n'
                            + 'OR v.vendor_city ILIKE $1\n'
                            + 'OR v.payment_terms ILIKE $1\n'
                            + 'AND v.vendor_id = i.vendor_id;';
                    break;

                case '1':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                    + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                    + 'FROM vendor v\n'
                    + 'WHERE v.vendor_id = $1;';

                case '2':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v\n'
                        + 'WHERE v.vendor_name ILIKE $1;';
                    break;
                    
                case '3':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v, item i\n'
                        + 'WHERE i.item_name ILIKE $1\n'
                            + 'AND v.vendor_id = i.vendor_id;';
                    break;

                case '4':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v\n'
                        + 'WHERE v.vendor_city ILIKE $1;'
                    break;       
                            
                case '5':
                    queryString = 'SELECT v.vendor_id, vendor_name, vendor_address,\n'
                        + 'vendor_city, vendor_state, vendor_zip, payment_terms\n'
                        + 'FROM vendor v\n'
                        + 'WHERE v.payment_terms ILIKE $1;'
                    break;

                default:
                    return done(new Error('No determinable search parameters found.'), null);
                
            }

            this.pool.query(queryString, ['%' + opts['search'] + '%'], function(err, res)
            {
                return done(err, res);
            });
        }
        else
        {
            this.pool.query('SELECT * FROM vendor;', function(err, res)
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
                        nums[1] = parseInt(nums[1]) + 1; 
                    }

                    queryString = 'SELECT item_num, item_name, item_desc, item_price,\n'
                        + 'min_quan, max_quan\n'
                        + 'FROM item\n'
                        + 'WHERE vendor_id = $1 AND\n'
                            + 'item_price BETWEEN ' + nums[0] + ' AND ' + nums[1] + ';';
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
            this.pool.query('SELECT item_num, item_name, item_desc, item_price,\n'
                + 'min_quan, max_quan\n'
                + 'FROM item;', function(err, res)
            {
                return done(err, res);
            });
        }
    }

    //This function inserts a new material request into the database.
    requestMaterials(matId, description, comment, quantity, uom, batchNum, source, destination, transNum,
        thawReq, refreezeDate, dateReq, requester, requsterId, done)
    {
        //Set up parameterized material query.
        var materialQueryString = 'INSERT INTO material_request '
            + '(material_number, description, comment, quantity_required,'
            + 'uom, batch_number, source_location, destination_location, transaction_number,'
            + 'thaw_required, refreeze_date, date_required, requester, requester_id)\n'
            + 'VALUES\n'
            + '(?,?,?,?,?,?,?,?,?,?,?,?,?,?);';

            var materialQuery = this.pool.query(materialQueryString, [matId, description, comment, quantity, uom, batchNum,
                source, destination, transNum, thawReq, refreezeDate, dateReq, requester, requsterId], function (err, res)
                {
                    if (err)
                    {
                        return done(err, null);
                    }
                    else if (res)
                    {
                        //I cant figure out how to create a material request and put it into the history table.
                        /*function createMaterialHistory(matId, description, comment, quantity, uom, batchNum, source, destination, transNum,
                            thawReq, refreezeDate, dateReq, requester, requsterId)
                        {

                            //Set up parameterized history query.
                            var historyQueryString = 'INSERT INTO material_request_history '
                                + '(idmaterial_request, material_number, description, comment, quantity_required,'
                                + 'uom, batch_number, source_location, destination_location, transaction_number,'
                                + 'thaw_required, refreeze_date, date_required, requester, requester_id)\n'
                                + 'VALUES\n'
                                + '(SELECT LAST_INSERTED_ID(),?,?,?,?,?,?,?,?,?,?,?,?,?)';

                            var historyQuery = this.pool.query(historyQueryString, [matId, description, comment, quantity, uom, batchNum,
                                source, destination, transNum, thawReq, refreezeDate, dateReq, requester, requsterId], function (error, result)
                                {
                                    return done(error, result);
                                });

                        }*/

                        return done(null, res);
                    }
                });
    }

    //This function returns all pending material requests from the database.
    viewPendingRequests(requesterId, done)
    {
        //Set up parameterized query.
        var queryString = 'SELECT * FROM material_request WHERE requester_id = ? AND '
            + '(manager_id IS NULL OR planner_id IS NULL OR fulfiller_id IS NULL) AND deleted IS NULL;';

        var query = this.pool.query(queryString, [requesterId], function (err, result)
        {
            return done(err, result);
        });
    }

    //This function updates material requests in the database, and adds the augmenter as having accepted the request.
    //The augmenter accepts it in the appropriate field based on their accessToken.
    //2 manager, 3 planner, 4 fulfiller.
    alterRequest(requesterId, requester, accessToken, data, done)
    {
        //Set up parameterized query and array for the loop.
        var updateQueryString = 'UPDATE material_request SET ';
        var parameterizedData = []

        for (var num in data)
        {
            var name = data[num].name;
            var value = data[num].value;

            if (name != 'idmaterial_request')
            {
                //Add all properties to the query and their values to the parameter array.
                updateQueryString += name + ' = ?, ';
                parameterizedData.push(value);
            }
        }

        //Add accepting lines based on accessToken.
        //Try switch case here.
        switch (accessToken)
        {
            case '0':
            //Intentionally left empty.

            case '1':
            //Intentionally left empty.

            case '2':

                //Manager query line.
                updateQueryString += 'approving_manager = ?, manager_id = ?, manager_approved_time = NOW(), ';
                parameterizedData.push(requester);
                parameterizedData.push(requesterId);

                if (accessToken == 2)
                {
                    break;
                }

            case '3':

                //Planning employee query line.
                updateQueryString += 'approving_planner = ?, planner_id = ?, planning_approved_time = NOW(), ';
                parameterizedData.push(requester);
                parameterizedData.push(requesterId);

                if (accessToken == 3)
                {
                    break;
                }

            case '4':

                //Fulfiller employee query line.
                updateQueryString += 'fulfiller = ?, fulfiller_id = ?, fulfilled_time = NOW(), ';
                parameterizedData.push(requester);
                parameterizedData.push(requesterId);

                break;
        }

        //Add altered by lines and push into parameters requester name.
        updateQueryString += ' altered_by = ?, alter_time = NOW() ';
        parameterizedData.push(requesterId);

        updateQueryString += 'WHERE idmaterial_request = ?'; // Add SELECT * WHERE idmaterial_request = ?;' here when i figure out how to do it properly.
        parameterizedData.push(data[0].value);
        //parameterizedData.push(data[0].value);

        var updateQuery = this.pool.query(updateQueryString, parameterizedData, function (err, result)
        {
            if (err)
            {
                return done(err, null);
            }
            else
            {
                //Update was successful, now return the result.
                return done(null, result)
            }
        });
    }

    //This method pseudo deletes a material request.
    pseudoDeleteRequest(matRequestId, requester)
    {
        //Set deleted = 1, this allows us to filter out these results from future queries.
        var queryString = 'UPDATE material_request SET deleted = 1, deleted_by = ?, deleted_time = NOW() WHERE idmaterial_request = ?'

        var query = this.pool.query(queryString, [matRequestId, requester], function (err, result)
        {
            return done(err, result);
        });
    }

    //Deletes the requested material
    actualDeleteRequest(matRequestId, allBool)
    {
        if (allBool == true)
        {
            //If user calling function wants all pseudo deletes to become permanent.
            var queryString = 'DELETE FROM material_request WHERE deleted = 1';

            var query = this.pool.query(queryString, function (err, result)
            {
                return done(err, result);
            });
        }
        else
        {
            //Permanently delete a single material request marked as deleted. 
            var queryString = 'DELETE FROM material_request WHERE idmaterial_request = ? AND deleted = 1';

            var query = this.pool.query(queryString, [matRequestId], function (err, result)
            {
                return done(err, result);
            });
        }
    }

    //This function searches for requests made within the last week and returns results found.
    viewRecentRequests(done)
    {
        //Set up parameterized query.
        var queryString = 'SELECT * FROM material_request\n'
            + 'WHERE requested_time >= CURDATE() - INTERVAL 7 DAY\n'
            + 'AND requested_time < CURDATE() + INTERVAL 1 DAY AND deleted IS NULL;';

        var query = this.pool.query(queryString, function (err, result)
        {
            return done(err, result);
        });
    }

    //This function searches for requests meeting users search input and returns results found.
    searchRequests(searchRequest, done)
    {
        //Set up parameterized query.
        var queryString = 'SELECT * FROM material_request WHERE material_number LIKE ? OR transaction_number LIKE ? '
            + 'OR source_location LIKE ? OR destination_location LIKE ? OR requester LIKE ? OR approving_manager LIKE ? '
            + 'OR approving_planner LIKE ? OR fulfiller LIKE ? AND deleted IS NULL;'
        var sr = '%' + searchRequest + '%';

        var query = this.pool.query(queryString, [sr, sr, sr, sr, sr, sr, sr, sr], function (err, result)
        {
            if (err)
            {
                return done(err, null);
            }
            else if (result.length < 1)
            {
                return done(err, null);
            }

            return done(err, result);
        });
    }
}
'use strict';

/**
 * Module Dependencies.
 */
const {Pool, Client} = require('pg');
const crypto = require('crypto');
const logger = require('../private/logger');
const User = require('../private/User');

module.exports = class DatabaseHandler
{
    constructor()
    {
        this.pool = new Pool(
            {
                host: 'localhost',
                user: 'postgres',
                database: 'testdb',
                password: '#GXZui?J]m.a:',
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

        this.pool.query('SELECT * FROM users WHERE username = $1', [username], function (err, result)
        {
            var user = new User();

            if (err)
            {
                //Log error and return null to show login failed.
                logger.error(err);
                return done(err, null);
            }
            else if (result.length == 0)
            {
                //No user found return null to show login failed.
                user = null;
            }
            else
            {
                //Check login credentials, against database.
                result = result.rows
                logger.info(result)
                user.id = result[0].iduser;
                user.username = result[0].username;
                user.name = result[0].name;
                user.email = result[0].email;
                user.accessToken = result[0].access_token;

                function hashPassword(pass)
                {
                    pass = crypto.createHmac('sha512', pass)
                        .update(result[0].user_salt)
                        .digest('hex');

                    return pass;
                };

                var hashPass = hashPassword(pass);

                if (hashPass != result[0].user_pass)
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

    //This function adds a new user into the database.
    addNewUser(username, name, email, pass, accessToken, done)
    {
        var salt = crypto.randomBytes(20).toString('hex');

        function hashPassword(password)
        {
            pass = crypto.createHmac('sha512', pass)
                .update(salt)
                .digest('hex');

            return pass;
        };

        var hashPass = hashPassword(pass);

        //Set up parameterized query.
        var queryString = 'INSERT INTO user'
            + '(username, name, email, password, salt, access_token)\n'
            + 'VALUES\n'
            + '(?,?,?,?,?,?);';

        var query = this.pool.query(queryString, [username, name, email, hashPass, salt, accessToken], function (err, result)
        {
            if (!err)
            {
                logger.info('Created new user for user: ' + username);
            }

            return done(err, true);

        });
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
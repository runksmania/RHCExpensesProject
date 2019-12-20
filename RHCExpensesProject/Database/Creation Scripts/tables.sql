/* RHC Expenses Project Database Table Creation File
   Last modified: 12-19-19
   Author: Michael Cottrell
*/

CREATE TABLE emp
(
    emp_num      INTEGER PRIMARY KEY,
    username     varchaR(20) UNIQUE NOT NULL,
    salt         varchar(40) NOT NULL,
    pass         varchar(128) NOT NULL,
    email        varchar(100),
    fname        varchar(40),
    lname        varchar(40),
    access_token INTEGER    
);
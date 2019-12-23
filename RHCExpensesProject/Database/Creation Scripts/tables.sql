/* RHC Expenses Project Database Table Creation File
   Last modified: 12-22-19
   Author: Michael Cottrell
*/

DROP TABLE IF EXISTS vendor CASCADE;

CREATE TABLE vendor
(
    vendor_id       SERIAL UNIQUE,
    vendor_name     VARCHAR(50)  NOT NULL,
    vendor_address  VARCHAR(50)  NOT NULL,
    vendor_city     VARCHAR(30)  NOT NULL,
    vendor_state    VARCHAR(2)   NOT NULL,
    vendor_zip      VARCHAR(10)  NOT NULL,
    payment_terms   VARCHAR(25),
    PRIMARY KEY     (vendor_id, vendor_name, vendor_address)
);

DROP TABLE IF EXISTS vendor_phones CASCADE;

create TABLE vendor_phones
(
    vendor_id      INTEGER REFERENCES vendor(vendor_id),
    vendor_phone   VARCHAR(15),
    phone_type     VARCHAR(10),
    PRIMARY KEY    (vendor_id, vendor_phone),
    CONSTRAINT     vend_phone_type_CONSTRAINT CHECK (phone_type IN ('Main', 'Fax'))
);

DROP TABLE IF EXISTS contact CASCADE;

create TABLE contact
(
    contact_id    SERIAL UNIQUE,
    contact_fname VARCHAR(20) NOT NULL,
    contact_lname VARCHAR(20) NOT NULL,
    contact_email VARCHAR(60) NOT NULL,
    vendor_id     INTEGER REFERENCES vendor(vendor_id),
    PRIMARY KEY   (contact_id, contact_fname, contact_lname, contact_email, vendor_id)
);

DROP TABLE IF EXISTS contact_phone CASCADE;

create TABLE contact_phone
(
    contact_id     INTEGER REFERENCES contact(contact_id),
    contact_phone  VARCHAR(20) NOT NULL,
    phone_type     VARCHAR(10) NOT NULL,
    phone_ext      VARCHAR(5) DEFAULT NULL,
    PRIMARY KEY    (contact_id, contact_phone),
    CONSTRAINT     con_phone_type_CONSTRAINT CHECK (phone_type IN ('Cell', 'Home', 'Office'))
);

DROP TABLE IF EXISTS item CASCADE;

create TABLE item
(
    item_num     SERIAL PRIMARY KEY,
    item_name    VARCHAR(50) NOT NULL,
    vendor_id    INTEGER REFERENCES vendor(vendor_id),
    item_price   MONEY NOT NULL,
    item_desc    VARCHAR(100) NOT NULL,
    min_quan     INTEGER,
    max_quan     INTEGER
);

DROP TABLE IF EXISTS dept CASCADE;

create TABLE dept
(
    dept_num    CHAR(2) PRIMARY KEY,
    dept_name   VARCHAR(20)
);

DROP TABLE IF EXISTS gl_codes CASCADE;

create TABLE gl_codes
(
    dept_num     CHAR(2) REFERENCES dept,
    gl_num       CHAR(5),
    gl_name      VARCHAR(50) NOT NULL,
    posting_type VARCHAR(100) NOT NULL,
    PRIMARY KEY  (dept_num, gl_num)
);

DROP TABLE IF EXISTS emp CASCADE;

CREATE TABLE emp
(
    emp_num      VARCHAR(4)   PRIMARY KEY,
    username     VARCHAR(20)  UNIQUE NOT NULL,
    fname        VARCHAR(40)  NOT NULL,
    lname        VARCHAR(40)  NOT NULL,
    salt         VARCHAR(40)  NOT NULL,
    pass         VARCHAR(128) NOT NULL,
    email        VARCHAR(100),
    access_token INTEGER    
);
 
DROP TABLE IF EXISTS emp_phone CASCADE;

create TABLE emp_phone
(
    emp_num     VARCHAR(4) REFERENCES emp,
    phone_num   VARCHAR(20),
    phone_type  VARCHAR(10),
    phone_ext   VARCHAR(5),
    PRIMARY KEY (emp_num, phone_num),
    CONSTRAINT  empl_phone_type CHECK (phone_type IN ('Cell', 'Home', 'Office'))
);

DROP TABLE IF EXISTS purchase_order CASCADE;

create TABLE purchase_order
(
    po_num        SERIAL PRIMARY KEY,
    dept_num      CHAR(2),
    gl_code       CHAR(5), 
    total_amount  MONEY,
    req_id        VARCHAR(4) REFERENCES emp,
    req_date      DATE,
    approver_id   VARCHAR(4) REFERENCES emp,
    approved_date DATE,
    vend_id       INTEGER,
    purch_date    DATE,
    receiver_id   VARCHAR(4) REFERENCES emp,
    receive_date  DATE,
    invoice_num   VARCHAR(20),
    paid_date     DATE,
    FOREIGN KEY   (dept_num, gl_code) REFERENCES gl_codes
);

DROP TABLE IF EXISTS items_purchased CASCADE;

create TABLE items_purchased
(po_num      INTEGER REFERENCES purchase_order,
 item_num    INTEGER,
 quantity    INTEGER,
 total       MONEY,
 PRIMARY KEY (po_num, item_num)
);

\i population.sql
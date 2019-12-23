/* RHC Expenses Project Database Default Population File
   Last modified: 12-22-19
   Author: Michael Cottrell
*/

delete from emp;

INSERT INTO emp
VALUES
(57, 
'mcottrell',
'Michael',
'Cottrell', 
'5b4ba79cc561a52b1483977135f93e6e498b8040',
'19fd3c18eb90cac76d0cc83cf349c583aa670d19d850905bb5b6551465e0d6c8c04072c438d6b842da4ef11885ce3ca48bee65038f1467348b2b401af6bd0fe4',
'mcottrell@redwoodhotelcasino.com',
1,
1
);

INSERT INTO emp
VALUES
(200, 
'cmorrow',
'Chris',
'Morrow', 
'186067f5f537d2cf7e57e0db4e515258861f7910',
'212e858fb78ad407d78a68b8316067f33cfc3a91bd81cbcf14ec9549e039bf302aa6f6448e74ba1bb6f01f2be9efc307e3e677fb36e99074d86881d2c0c31ef5',
'cmorrow@redwoodhotelcasino.com',
1,
1
);

delete from dept;
delete from gl_codes;

--\i dept_population.sql
--\i gl_population.sql
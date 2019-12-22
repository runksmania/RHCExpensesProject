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
1
);

delete from dept_gl_intersect;
delete from dept;
delete from gl_codes;

\i dept_population.sql
\i gl_population.sql
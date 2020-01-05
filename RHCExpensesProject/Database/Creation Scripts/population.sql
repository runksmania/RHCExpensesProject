/* RHC Expenses Project Database Default Population File
   Last modified: 1-5-20
   Author: Michael Cottrell
*/

SELECT 'Populating departments...';
\i dept_population.sql

SELECT 'Populating employees...';
\i emp_population.sql

SELECT 'Populating vendors...';
\i vendor_population.sql

SELECT 'Populating items...';
\i item_population.sql

--SELECT 'Populating Gl Codes...'
--\i gl_population.sql
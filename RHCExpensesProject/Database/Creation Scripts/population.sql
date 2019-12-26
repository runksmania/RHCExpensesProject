/* RHC Expenses Project Database Default Population File
   Last modified: 12-26-19
   Author: Michael Cottrell
*/

SELECT 'Populating departments...';
\i dept_population.sql

SELECT 'Populating employees...'
\i emp_population.sql

--SELECT 'Populating Gl Codes...'
--\i gl_population.sql
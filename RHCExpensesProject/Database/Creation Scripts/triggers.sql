/* RHC Expenses Project Database Trigger Creation File
   Last modified: 12-25-19
   Author: Michael Cottrell
*/

CREATE OR REPLACE FUNCTION prev_pass_procedure()
    RETURNS TRIGGER AS $prev_pass_procedure$
    BEGIN
        INSERT INTO emp_prev_pass
        VALUES
        (NEW.emp_num, NEW.pass);
        RETURN NEW;
    END;
$prev_pass_procedure$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prev_pass_trig ON emp CASCADE;

CREATE  TRIGGER prev_pass_trig 
    AFTER UPDATE OR INSERT
    ON emp
    FOR EACH ROW EXECUTE PROCEDURE prev_pass_procedure();
/* RHC Expenses Project Database Default Item Population File
   Last modified: 1-5-20
   Author: Michael Cottrell
   Table Schema: item_num | item_name | vendor_id | item_price | item_desc | min_quan | max_quan
*/

DELETE FROM ITEM;

INSERT INTO item
VALUES
(DEFAULT, 'Marlboro Carton', 2, 81, 'A carton of regular Marlboro.', 1, 1000);

INSERT INTO item
VALUES
(DEFAULT, 'Marlboro Menthol Crush', 2, 81, 'A carton of Marlboro Menthol Crush.', 1, 1000);

INSERT INTO item
VALUES
(DEFAULT, 'Marlboro Black', 2, 88, 'A carton of Marlboro Black.', 1, 1000);

INSERT INTO item
VALUES
(DEFAULT, 'Quarter Box', 1, 500, 'A box of rolled quarters', 1, 100);

INSERT INTO item
VALUES
(DEFAULT, 'Dime Box', 1, 250, 'A box of rolled dimes', 1, 100);

INSERT INTO item
VALUES
(DEFAULT, 'S3000', 3, 8000, 'A S3000 slot machine.', 1, 1000);
/* RHC Expenses Project Database Default Vendor Population File
   Last modified: 1-5-20
   Author: Michael Cottrell
*/

DELETE FROM VENDOR;

INSERT INTO vendor
VALUES
(DEFAULT, 'Tri Counties', '171 Klamath Blvd', 'Klamath', 'CA', '95548', 'Net 30');

INSERT INTO vendor
VALUES
(DEFAULT, 'McLane Company Inc', '4747 McLane Parkway', 'Temple', 'TX', '76504', 'COD');

INSERT INTO vendor
VALUES
(DEFAULT, 'Aristocrat Technologies', 'Building A, Pinnacle Office Park 85 Epping Rd', 'North Ryde', 'AU', '2113', 'Net 30');
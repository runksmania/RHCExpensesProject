/* Michael Cottrell
   CS 325 - Fall 2019
   Last modified: 12-13-19
*/

drop sequence vend_seq;

create sequence vend_seq start with 1;

drop table vendor cascade constraints;

create table vendor
(vendor_id       integer,
 vendor_name     varchar(50)  not null,
 vendor_address  varchar2(50) not null,
 vendor_city     varchar2(30) not null,
 vendor_state    varchar2(2)  not null,
 vendor_zip      varchar2(10) not null,
 primary key     (vendor_id, vendor_name, vendor_address),
 constraint      uniq_vendor unique (vendor_id)
);

drop table vendor_phones cascade constraints;

create table vendor_phones
(vendor_id      integer,
 vendor_phone   varchar2(15),
 phone_type     varchar2(10),
 primary key    (vendor_id, vendor_phone),
 foreign key    (vendor_id) references vendor (vendor_id),
 constraint     vend_phone_type_constraint check (phone_type in ('Main', 'Fax'))
);

drop sequence con_seq;

create sequence con_seq start with 1;

drop table contact cascade constraints;

create table contact
(contact_id    integer,
 contact_fname varchar2(20),
 contact_lname varchar2(20),
 contact_email varchar2(60),
 vendor_id     integer,
 primary key   (contact_id, contact_fname, contact_lname, contact_email, vendor_id),
 foreign key   (vendor_id) references vendor (vendor_id),
 constraint    uniq_contact unique (contact_id)
);

drop table contact_phone cascade constraints;

create table contact_phone
(contact_id     integer,
 contact_phone  varchar2(20),
 phone_type     varchar2(10),
 phone_ext      varchar2(5) null,
 primary key    (contact_id, contact_phone),
 foreign key    (contact_id) references contact (contact_id),
 constraint     con_phone_type_constraint check (phone_type in ('Cell', 'Home', 'Office'))
);

drop sequence item_seq;

create sequence item_seq start with 1;

drop table item cascade constraints;

create table item
(item_num     integer,
 item_name    varchar2(50),
 vendor_id    integer,
 item_price   number(*,2),
 item_desc    varchar2(100),
 min_quan     integer,
 max_quan     integer,
 primary key  (item_num),
 foreign key  (vendor_id) references vendor (vendor_id)
);

drop table general_ledger_codes cascade constraints;

create table general_ledger_codes
(code_num    integer,
 code_name   varchar2(50),
 code_desc   varchar2(100),
 primary key (code_num)
);

drop table dept cascade constraints;

create table dept
(dept_num    integer,
 dept_name   varchar2(20),
 primary key (dept_num)
);

drop table empl cascade constraints;

create table empl
(emp_id      varchar2(4),
 emp_fname   varchar2(20),
 emp_lname   varchar2(20),
 dept_num    integer,
 auth_level  integer,
 primary key (emp_id),
 foreign key (dept_num) references dept (dept_num)
);
 
drop table empl_phone cascade constraints;

create table empl_phone
(emp_id     varchar2(4),
 phone_num   varchar2(20),
 phone_type  varchar2(10),
 phone_ext   varchar2(5),
 primary key (emp_id, phone_num),
 foreign key (emp_id) references empl (emp_id),
 constraint  empl_phone_type check (phone_type in ('Cell', 'Home', 'Office'))
);

drop sequence po_seq;

create sequence po_seq start with 1;

drop table purchase_order cascade constraints;

create table purchase_order
(po_num         integer,
 gen_ledge_code integer, 
 total_amount   number(*,2),
 req_id         integer,
 approver_id    integer,
 vend_id        integer,
 req_date       date,
 purch_date     date,
 receive_date   date,
 receiver_id    integer,
 invoice_num    integer,
 paid_date      date,
 primary key    (po_num),
 foreign key    (gen_ledge_code) references general_ledger_codes (code_num)
);

drop table items_purchased cascade constraints;

create table items_purchased
(po_num      integer,
 item_num    integer,
 quantity    integer,
 total       number(*,2),
 primary key (po_num, item_num),
 foreign key (po_num) references purchase_order (po_num)
);

set serveroutput on

create or replace trigger update_total
	after
    insert
	on items_purchased
	for each row
declare
	po_num_to_change integer;

begin
	select po_num
    into po_num_to_change
    from purchase_order
    where po_num = :new.po_num;

    update purchase_order
    set total_amount = total_amount + :new.total
    where po_num = po_num_to_change;    

end;
/

show errors

drop view orders;

create view orders AS
select   p.po_num, gen_ledge_code, concat(emp_fname, concat(' ', emp_lname)) emp_name, item_name
from     purchase_order p,
         items_purchased ip,
         empl e,
         item i
where    p.req_id = e.emp_id and ip.item_num = i.item_num and p.po_num = ip.po_num;


drop view orders_with_total;

create view orders_with_total AS
select   p.po_num, gen_ledge_code, concat(emp_fname, concat(' ', emp_lname)) emp_name, item_name, total
from     purchase_order p,
         items_purchased ip,
         empl e,
         item i
where    p.req_id = e.emp_id and ip.item_num = i.item_num and p.po_num = ip.po_num;

drop view orders_date_report;

create view orders_date_report AS
select   p.po_num "PO #:", gen_ledge_code "Expense Code:", concat(emp_fname, concat(' ', emp_lname)) "Req by:",
     item_name "Item:", total "Total:", req_date "Date Req:", paid_date "Date Paid:"
from     purchase_order p,
         items_purchased ip,
         empl e,
         item i
where    p.req_id = e.emp_id and ip.item_num = i.item_num and p.po_num = ip.po_num;
# Description: This file will generate the default sql population for RHC database.
# Author: Michael Cottrell
# Last Modified: 12-21-19

from csv_processor import process_csv
import datetime

d = datetime.datetime.today()

data = process_csv('depts.csv')

with open('../RHCExpensesProject/Database/Creation Scripts/dept_population.sql', 'w') as dept_file:

  header_string = '/* RHC Expenses Project Database Default Department Population File\n'
  header_string += '   Last modified: ' + d.strftime('%m-%d-%Y') + '\n'
  header_string += '   Author: Michael Cottrell\n'
  header_string += '*/\n'

  print(header_string, file=dept_file)

  for i in data:

    if i[0] != 'Department Number':
      sql_string = 'INSERT INTO dept\n'
      sql_string += 'VALUES\n'
      sql_string += '(' + '\'' + i[0] + '\'' + ', ' + '\'' + i[1] + '\'' + ');\n'
      
      print(sql_string, file=dept_file)

data = process_csv('GL Codes.csv')

with open('../RHCExpensesProject/Database/Creation Scripts/gl_population.sql', 'w') as gl_file:

  header_string = '/* RHC Expenses Project Database Default GL Population File\n'
  header_string += '   Last modified: ' + d.strftime('%m-%d-%Y') +'\n'
  header_string += '   Author: Michael Cottrell\n'
  header_string += '*/\n'

  print(header_string, file=gl_file)

  for i in data:

    if i[0] != 'Account Number':

      list_strings = i[0].split('-')
      
      for j in i[1:]:
        list_strings.append(j)

      for j in range(len(list_strings)):

        if '\'' in list_strings[j]:
          index = list_strings[j].find('\'')
          list_strings[j] = list_strings[j][:index] + '\'' + list_strings[j][index:]

        list_strings[j] = '\'' + list_strings[j] + '\''
  
      sql_string = 'insert into gl_codes\n' 
      sql_string += 'values\n'
      sql_string += '(' + ','.join(list_strings) + ');\n'
      
      print(sql_string, file=gl_file)
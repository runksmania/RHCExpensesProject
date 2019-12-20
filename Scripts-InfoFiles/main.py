from csv_processor import process_csv

data = process_csv('GL Codes.csv')

with open('insert_GL.sql', 'w') as gl_file:

  Gl_sql = []

  for i in data:

    if i[0] != 'Account Number':

      x = i[0].split('-')
  
      for j in i[1:]:
        
        if '\'' in j:
          index = j.find('\'')
          j = j[:index] + '\'' + j[index:]

        x.append('\'' + j + '\'')


      sql_string = 'insert into gl_codes\n'
      sql_string += 'values\n(' + ','.join(x) + ');\n'


      Gl_sql.append(sql_string)

  for j in Gl_sql:
    print(j, file=gl_file)
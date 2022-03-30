# DocTech-BE
Yes, pushing to a branch named differently that your current one is possible using the syntax:
**git push heroku other:master**


 _**heroku config:set MYSQL_URI="value"**_

******\*\*MUST READ\*********
https://dev.to/mtee/day-48-defining-relationships-using-typeorm-3g61

to generate migration files for the entities supplied in ormconfig.json:  **[_typeorm migration:generate -n migrationName_]**

to run the migration files. This should be the \*.js files after the build: **[_typeorm migration:run_]**

Alternatively, migrations could be executed when the app is starting up/ running using **connection.runMigrations()**. All the details has to be provided in the json object used for creating connection. Keys like '**migrationsRun**' etc.

https://typeorm.io/#/active-record-data-mapper/what-is-the-active-record-pattern

https://wanago.io/2019/01/28/typeorm-migrations-postgres/

https://typeorm.io/#/connection-options/common-connection-options

https://github.com/typeorm/typeorm/issues/4295

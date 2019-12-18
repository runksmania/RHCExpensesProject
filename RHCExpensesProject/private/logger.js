const log4js = require('log4js');

log4js.configure(
    {
        appenders:
        {
            //Commenting out log appenders for files until release.
            /*everything: { type: 'file', filename: '../LogFiles/allLogs.log' },
            emergencies: { type: 'file', filename: '../LogFiles/error.log' },*/
            justErrors: { type: 'logLevelFilter', appender: 'emergencies', level: 'warn' },
            out: { type: 'stdout', level: 'debug' },
            info: { type: 'logLevelFilter', appender: 'out', level: 'debug' }
        },
        categories:
        {
            default: { appenders: [/*'everything', */'info'/*, 'justErrors'*/], level: 'debug' }
        }
    });

const logger = log4js.getLogger();

module.exports = logger;
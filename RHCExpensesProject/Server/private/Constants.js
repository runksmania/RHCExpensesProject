//This class is used for constant variables for easy access.

module.exports = class Constants
{
    constructor()
    {
        //The following two lines of code are to switch the host between local and public.
        //Switch which line is commented to change state.
        this.host = 'localhost';
        //this.host = "192.168.1.4";
        this.port = "8080";
    }
}

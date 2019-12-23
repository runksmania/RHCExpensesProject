//This class is used for constant variables for easy access.

module.exports = class Constants
{
    constructor()
    {
        //The following two lines of code are to switch the host between local and public.
        //Switch which line is commented to change state.
        this.host = 'localhost';
        //this.host = "10.26.0.152";
        this.port = "8080";
    }
}

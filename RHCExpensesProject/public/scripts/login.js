'use strict'

$(document).ready(function ()
{
    //Function to change focus to password entry when hitting tab in username field.
    $('.usernameInput').keydown(function (e)
    {
        var key = e.keycode || e.which;

        //Check if key == tab.
        if (key == 9)
        {
            $('.passwordInput').focus();
            e.preventDefault();
        }
    });

    //Event listener to check if caps lock is on.
    $('.passwordInput').keypress(function (e)
    {
        var s = String.fromCharCode(e.which);

        //If s is an upercase version of the letter and shift key is not pressed show caps lock warning.
        if (s.toUpperCase() === s && s.toLowerCase() !== s && !e.shiftKey)
        {
            $('.capsOn').show();
        } else
        {
            $('.capsOn').hide();
        }
    });
});

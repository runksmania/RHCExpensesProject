'use strict'

function validateMatch()
{
    var user_pass = $("#pass").val();
    var user_pass2 = $("#passConfirm").val();

    if (user_pass == user_pass2 && user_pass.length > 0)
    {
        $('.passMismatch').hide();
    }
    else
    {
        $('.passMismatch').show();
        $('.passMismatch').css('color', 'red');
    }
}

$(document).ready(function ()
{
    $('.newUserForm').submit(function(e)
    {
        var user_pass = $("#pass").val();
        var user_pass2 = $("#passConfirm").val();

        if (user_pass === user_pass2 && user_pass.length > 0)
        {
            return true;
        } else
        {
            e.preventDefault(e);
            return false;
        }

    });

    //Event listener to check if caps lock is on.
    $('.pass').keypress(function (e)
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

    $("#passConfirm").on('keyup', validateMatch);
    $("#pass").on('keyup', validateMatch);
});

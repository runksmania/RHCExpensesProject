'use strict'

$(document).ready(function ()
{

    $("#passConfirm").blur(function ()
    {
        var user_pass = $("#pass").val();
        var user_pass2 = $("#passConfirm").val();

        if (user_pass.length == 0)
        {
            animatePasswordMismatch();
        } else if (user_pass === user_pass2)
        {
            $('.passMismatch').hide();
        } else
        {
            animatePasswordMismatch();
        }

    });

    function animatePasswordMismatch()
    {
        $('.passMismatch').show();
        $('.passMismatch').css('color', 'red');
        $('.passMismatch').effect('shake', { times: 2 }, 500);
    }

    $('.newUserForm').submit(function(e)
    {
        var user_pass = $("#pass").val();
        var user_pass2 = $("#passConfirm").val();
        alert('hello');

        if (user_pass === user_pass2 && user_pass.length != 0)
        {
            return true;
        } else
        {
            animatePasswordMismatch()
            e.preventDefault(e);
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
});

'use strict'

$(document).ready(function ()
{
    $(".passConfirm").blur(function ()
    {
        var user_pass = $(".pass").val();
        var user_pass2 = $(".passConfirm").val();
        var submit = $('submit');

        if (user_pass.length == 0)
        {
            alert("please fill password first");
            submit.disabled = true;
        } else if (user_pass == user_pass2)
        {
            submit.disabled = false;
        } else
        {
            submit.disabled = true;
            alert("Your password doesn't same");
        }

    });
});
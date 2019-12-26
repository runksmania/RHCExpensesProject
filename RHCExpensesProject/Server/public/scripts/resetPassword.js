'use strict'

/*Actual validation function*/
function validatePassword() {
    /*Array of rules and the information target*/
    var rules = [{
        Pattern: "[A-Z]",
        Target: "UpperCase"
      },
      {
        Pattern: "[a-z]",
        Target: "LowerCase"
      },
      {
        Pattern: "[0-9]",
        Target: "Numbers"
      },
      {
        Pattern: "[!@@#$%^&*]",
        Target: "Symbols"
      }
    ];
  
    //Just grab the password once
    var password = $(this).val();
  
    /*Length Check, add and remove class could be chained*/
    /*I've left them seperate here so you can see what is going on */
    /*Note the Ternary operators ? : to select the classes*/
    $("#Length").removeClass(password.length > 7 ? "glyphicon-remove" : "glyphicon-ok");
    $("#Length").addClass(password.length > 7 ? "glyphicon-ok" : "glyphicon-remove");
    
    /*Iterate our remaining rules. The logic is the same as for Length*/
    for (var i = 0; i < rules.length; i++) {
  
      $("#" + rules[i].Target).removeClass(new RegExp(rules[i].Pattern).test(password) ? "glyphicon-remove" : "glyphicon-ok"); 
      $("#" + rules[i].Target).addClass(new RegExp(rules[i].Pattern).test(password) ? "glyphicon-ok" : "glyphicon-remove");
    }
        
}

function validateMatch()
{
    var user_pass = $("#pass").val();
    var user_pass2 = $("#passConfirm").val();

    if (user_pass == user_pass2 && user_pass.length > 0)
    {
        $('#Match').removeClass("glyphicon-remove");
        $('#Match').addClass("glyphicon-ok");
    }
    else
    {
        $('#Match').addClass("glyphicon-remove");
        $('#Match').removeClass("glyphicon-ok");
    }
}

$(document).ready(function ()
{
    
    $('.resetPassForm').submit(function(e)
    {
        var user_pass = $("#pass").val();
        var user_pass2 = $("#passConfirm").val();
        alert('hello');
        e.preventDefault();

        if (user_pass === user_pass2 && user_pass.length != 0)
        {
            return true;
        } else
        {
            animatePasswordMismatch()
            e.preventDefault(e);
        }

    });

    //Event listeners to check if caps lock is on.
    $('#pass').keypress(function (e)
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

    $('#passConfirm').keypress(function (e)
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

    $("#pass").on('keyup', validatePassword);
    $("#passConfirm").on('keyup', validateMatch);
});

'use strict'

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

/*Actual validation function*/
function validatePassword() {    

    var password = $(this).val();
  
    $("#Length").removeClass(password.length > 7 ? "glyphicon-remove" : "glyphicon-ok");
    $("#Length").addClass(password.length > 7 ? "glyphicon-ok" : "glyphicon-remove");
    
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

function validate(password1, password2)
{
    var boolsArr = [password1 === password2];

    for (var i = 0; i < rules.length; i++) {
  
        boolsArr.push(new RegExp(rules[i].Pattern).test(password1) ? true : false); 
    }

    for (var i = 0; i < boolsArr.length; i++)
    {
        if (boolsArr[i] == false)
        {
            return false;
        }
    }

    return true;
}

$(document).ready(function ()
{
    
    $('.resetPassForm').submit(function(e)
    {
        var user_pass = $("#pass").val();
        var user_pass2 = $("#passConfirm").val();
        var isValid = validate(user_pass, user_pass2);

        if (isValid)
        {
            return true;
        } else
        {
            e.preventDefault(e);
            return false;
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
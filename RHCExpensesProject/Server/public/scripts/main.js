'use strict'

$(document).ready(function ()
{
    var maxWidth = 0
    
    $('h4').each( function()
    {
        maxWidth = $(this).width() > maxWidth ? $(this).width() : maxWidth;
    });

    $('h4').each( function()
    {
        $(this).width(maxWidth);
    });
});
'use strict'

$(document).ready(function()
{
    $('.table').submit(function (e)
    {
        e.preventDefault;
        var form = $(e.target).serializeArray();

        for (var fieldNum in form)
        {
            if (form[fieldNum].value == "N/A")
            {
                form[fieldNum].value = "";
            }
            else if (form[fieldNum].value == "No")
            {
                form[fieldNum].value = "";
            }
        }

        ajaxUpdateRequest(form);
    });

    function ajaxUpdateRequest(formData)
    {
        var urlString = window.location.pathname + '/?';

        $.ajax({
            method: "post",
            url: urlString,
            data: { form: formData }
        })
            .done(function (result)
            {
                alert(result);
                //updateForm(result, form);
            });
    }
});
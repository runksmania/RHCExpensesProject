'use strict'

$(document).ready(function ()
{
    //Show tooltip for what search parameters are used in search bar.
    $('.info').hover(
        function ()
        {
            $('.tooltip').css('opacity', '100');
        },
        function ()
        {
            $('.tooltip').css('opacity', '0');
        }
    );

    //Keypress event for enter. Passes value of search input to method that handles ajax query.
    $('.searchField').keypress(function (e)
    {
        var key = e.keycode || e.which;

        //Check if key == enter.
        if (key == 13)
        {
            searchRequests($(this).val().replace(/(<([^>]+)>)/ig, ""));
        }
    });

    //Sends ajax request to server with user's input and gets the results.
    function searchRequests(searchInput)
    {
        var urlString = window.location.origin + '/items/search/vendor/' + $('.vendorId').val();
        
        if ($('#parameters').val() == null)
        {
            $('#parameters').val('');
        }
        else if ($('#parameters').val() == '3' && (isNaN(searchInput) || searchInput == ''))
        {
            //If searching by price with invalid number return no results.
            updateTable([]);
            return;
        }

        $.ajax({
            method: "get",
            url: urlString,
            data: { narrow: $('#parameters').val(), search: searchInput }
        })
            .done(function (result)
            {
                updateTable(result);
            });
    }


    //Takes search results and updates the table with results.
    function updateTable(searchResults)
    {
        if (searchResults[0] == null)
        {
            //If nothing was found shake and reshow no .noResults to user.
            $('.noResults').css('color', 'red');
            $('.noResults').effect('shake', { times: 2 }, 500);
            $('.resultsTable tbody').empty();
            $('.noResults').show();
        }
        else
        {
            //Else create table rows string and append to tbody.
            $('.noResults').hide();
            var tableRowString = '';
            
            for (var i = 0; i < searchResults.length; i++)
            {
                tableRowString += '<tr>\n';
                
                for (var property in searchResults[i])
                {
                    if (property != 'item_num')
                    {
                        tableRowString += '<td>' + '<input type="text" name="' + property + '" value="'
                            + searchResults[i][property] + '"></td>\n';
                    }
                    else 
                    {
                        tableRowString += '<td style="display: none;">' + '<input type="text" name="' 
                            + property + '" value="'
                            + searchResults[i][property] + '"></td>\n';
                    }
                }
                
                tableRowString += '</tr>\n';
            }

            $('.resultsTable tbody').empty().append(tableRowString).show();
        }
        
    }
});

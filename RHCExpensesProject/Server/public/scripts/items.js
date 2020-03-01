'use strict'

$(document).ready(function ()
{
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

    function validateNumbers (val1, val2)
    {
        var isNum = !isNaN(val1) && !isNaN(val2);
        var bothEmpty = val1 == val2 && (val2 == '' || val1 == '');

        return isNum && !bothEmpty;
    }

    //Keypress event for enter. Passes value of search input to method that handles ajax query.
    $('.minRange').keypress(function (e)
    {
        var key = e.keycode || e.which;

        //Check if key == enter.
        if (key == 13)
        {
            var minVal = $(this).val();
            var maxVal = $('.maxRange').val();

            if (validateNumbers(minVal, maxVal))
            {
                if (minVal == '')
                {
                    minVal = '0';
                }

                if (maxVal == '')
                {
                    maxVal = '1000000000';
                }

                $('.invalidInput').css('opacity', '0');
                searchRequests(minVal + ' ' + maxVal);
            }
            else 
            {
                $('.invalidInput').css('opacity', '1');
            }
        }
    });

    //Keypress event for enter. Passes value of search input to method that handles ajax query.
    $('.maxRange').keypress(function (e)
    {
        var key = e.keycode || e.which;

        //Check if key == enter.
        if (key == 13)
        {
            var maxVal = $(this).val();
            var minVal = $('.minRange').val();

            if (validateNumbers(minVal, maxVal))
            {
                if (minVal == '')
                {
                    minVal = '0';
                }

                if (maxVal == '')
                {
                    maxVal = '1000000000';
                }

                $('.invalidInput').css('opacity', '0');
                searchRequests(minVal + ' ' + maxVal);
            }
            else 
            {
                $('.invalidInput').css('opacity', '1');
            }
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

    $('#parameters').change(function()
    {
        var val = $(this).val();

        if (val == '3')
        {
            $('.searchWrapper').width(0);
            $('.searchWrapper').css('visibility', 'hidden');
            $('.minRange').show();
            $('.maxRange').show();
        }
        else if (val == '')
        {
            $('.searchWrapper').width('auto');
            $('.searchWrapper').css('visibility', 'hidden');
            $('.minRange').hide();
            $('.maxRange').hide();
        }
        else
        {
            $('.minRange').hide();
            $('.maxRange').hide();
            $('.searchWrapper').width('auto');
            $('.searchWrapper').css('visibility', 'visible');
        }
    });

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

            $('th').each( function ()
            {
                $('.resultsTable tbody').append('<td>N/A</td>');
            });
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

    $('#saveBtn').click(function()
    {
        var toSave = []

        $('tbody tr').each(function(row)
        {
            $(this).find('td').each(function(col, td)
            {
                if (!toSave[row])
                {
                    toSave.push([])
                }

                if ($(td).find('input').length && col != 1 && col != 2)
                {
                    toSave[row].push($(td).find('input').val())
                }
                else if (col != 1 && col != 2)
                {
                    toSave[row].push($(td).text())
                }
            });
        });

        var urlString = window.location.origin + '/items/update';

        $.ajax({
            method: "put",
            url: urlString,
            data: { data: toSave }
        })
            .done(function (result)
            {
                updateTable(result);
            });
    });
});

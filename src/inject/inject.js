function parseQuery(query) {
    query = query.substr(1); //Remove the ? at the beginning
    var vars = query.split('&');
    var params = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return params
}

$(document).ready(function () {
    $('#listing').on('click', 'a', function (event) {
        var a = $(event.target)[0];
        
    });
});
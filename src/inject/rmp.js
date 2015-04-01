var rmp = null;

function makeRMPSection() {
    rmp = $(
        '<div class="section">' +
            '<h3>Rate My Professor</h3>' +
            '<div id="rmp">' +
                '<div class="yes-data">' +
                    '<ul>' +
                        '<li><strong>Overall Quality: </strong><span id="overall-quality"></span></li>' +
                        '<li><strong>Helpfulness: </strong><span id="helpfulness"></span></li>' +
                        '<li><strong>Clarity: </strong><span id="clarity"></span></li>' +
                        '<li><strong>Easiness: </strong><span id="easiness"></span></li>' +
                    '</ul>' +
                '</div>' +
                '<div class="no-data">No data could be found for this professor</div>' +
                '<div class="loading-data">Loading data...</div>' +
            '</div>' +
        '</div>'
    );

    return rmp;
}

function formatRMP(data) {
    rmp.find('.loading-data').slideUp(500);

    if (data) {
        rmp.find('#overall-quality').text(data.overallQuality);
        rmp.find('#helpfulness').text(data.helpfulness);
        rmp.find('#clarity').text(data.clarity);
        rmp.find('#easiness').text(data.easiness);
        rmp.find('.yes-data').slideDown(500);

        rmp.find('h3').html('<a href="'+data.url+'" target="_blank">Rate My Professor</a>');
    } else {
        rmp.find('h3').html('Rate My Professor');
        rmp.find('.no-data').slideDown(500);
    }
}

function getTeacherInfo(id, callback) {
    var url = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid=' + id;

    chrome.runtime.sendMessage({
        method: 'GET',
        action: 'xhttp',
        url: url
    }, function (html) {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(html, "text/html");
        var page = $(htmlDoc);

        var data = {};

        data.overallQuality = page.find('.rating-breakdown').find('.breakdown-wrapper').children().first().find('.grade').text();
        data.helpfulness = $(page.find('.rating-breakdown').find('.faux-slides').children()[0]).find('.rating').text();
        data.clarity = $(page.find('.rating-breakdown').find('.faux-slides').children()[1]).find('.rating').text();
        data.easiness = $(page.find('.rating-breakdown').find('.faux-slides').children()[2]).find('.rating').text();
        data.url = url;

        callback(data);
    });
}

function getRMP(teacher, callback) {
    if (teacher.lname === 'Ord' && teacher.fname === 'Richard') {
        teacher.fname = 'Rick';
    }

    var url = 'http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&callback=jQuery1110021761036990210414_1427756491821' +
        '&q=' + teacher.fname + '+' + teacher.lname +
        '&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20';

    chrome.runtime.sendMessage({
        method: 'GET',
        action: 'xhttp',
        url: url
    }, function (results) {
        results = results.substr(results.indexOf('{'), results.length - results.indexOf('{') - 2);
        var json = JSON.parse(results);

        if (json.grouped.content_type_s.matches === 0) {
            formatRMP(null);
            callback();
        } else {
            var teachers = json.grouped.content_type_s.groups[0].doclist.docs;
            var teacher = false;
            for (var i in teachers) {
                if (teachers[i].schoolname_s === 'University of California San Diego') {
                    teacher = teachers[i].pk_id;
                    break;
                }
            }

            if (teacher) {
                getTeacherInfo(teacher, function (data) {
                    formatRMP(data);
                    callback();
                });
            } else {
                formatRMP(null);
                callback();
            }
        }
    });
}
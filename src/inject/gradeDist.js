function getMostRecent(gradeDists) {
    var mostRecent = {};
    var mostRecentSeason = '';
    var mostRecentYear = '';

    $.each(gradeDists, function (i, val) {
        var thisSeason = val.termCode.substr(0, 2);
        var thisYear = val.termCode.substr(2, 4);

        if (Object.keys(mostRecent).length === 0) { //If mostRecent is empty
            mostRecent = val;
            mostRecentSeason = thisSeason;
            mostRecentYear = thisYear;
        } else {
            if (thisYear > mostRecentYear) {
                mostRecent = val;
                mostRecentSeason = thisSeason;
                mostRecentYear = thisYear;
            } else if (thisYear === mostRecentYear) {
                if (thisSeason === 'FA') {
                    mostRecent = val;
                    mostRecentSeason = thisSeason;
                    mostRecentYear = thisYear;
                } else if (thisSeason === 'WI' && mostRecentSeason !== 'FA') {
                    mostRecent = val;
                    mostRecentSeason = thisSeason;
                    mostRecentYear = thisYear;
                }
            }
        }
    });

    return mostRecent;
}

function getGradeDistribution(teacher, course, callback) {
    var url = 'http://asucsd.ucsd.edu/gradeDistribution?' +
        'GradeDistribution%5BTERM_CODE%5D=' +
        '&GradeDistribution%5BSUBJECT_CODE%5D='+ course.subjectCode +
        '&GradeDistribution%5BCOURSE_CODE%5D=' + course.courseCode +
        '&GradeDistribution%5BCRSE_TITLE%5D=' +
        '&GradeDistribution%5BINSTRUCTOR%5D=' + encodeURIComponent(teacher.nomiddle) +
        '&GradeDistribution%5BGPA%5D=' +
        '&GradeDistribution_page=1' +
        '&ajax=gradedistribution-grid';

    chrome.runtime.sendMessage({
        method: 'GET',
        action: 'xhttp',
        url: url
    }, function(html) {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(html, "text/html");
        var page = $(htmlDoc);
        var tableRows = page.find('#gradedistribution-grid').children('table.items').children('tbody').children();

        if (tableRows.first().children().first().hasClass('empty')) {
            callback(null);
        } else {
            var gradeDists = [];

            $(tableRows).each(function (i, tr) {
                var cells = $(tr).children();
                var termCode = $(cells[0]).text(); //e.g. SP13
                var gpa = $(cells[5]).text();
                var aPercent = $(cells[6]).text();
                var bPercent = $(cells[7]).text();
                var cPercent = $(cells[8]).text();
                var dPercent = $(cells[9]).text();
                var fPercent = $(cells[10]).text();
                var wPercent = $(cells[11]).text();
                gradeDists.push({
                    termCode: termCode,
                    aPercent: aPercent,
                    bPercent: bPercent,
                    cPercent: cPercent,
                    dPercent: dPercent,
                    fPercent: fPercent,
                    wPercent: wPercent,
                    gpa: gpa
                });
            });

            var mostRecent = getMostRecent(gradeDists);
            callback(mostRecent);
        }
    });
}
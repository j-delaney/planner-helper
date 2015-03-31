var gradeDist = null;

function makeGradeDistSection() {
    gradeDist = $(
        '<div class="section">' +
            '<h3>Grade Distribution</h3>' +
            '<div id="grade-dist">' +
                '<div class="yes-data">' +
                    '<ul>' +
                        '<li><strong>A: </strong><span id="grade-dist-a"></span></li>' +
                        '<li><strong>B: </strong><span id="grade-dist-b"></span></li>' +
                        '<li><strong>C: </strong><span id="grade-dist-c"></span></li>' +
                        '<li><strong>D: </strong><span id="grade-dist-d"></span></li>' +
                        '<li><strong>F: </strong><span id="grade-dist-f"></span></li>' +
                        '<li><strong>W: </strong><span id="grade-dist-w"></span></li>' +
                        '<li><strong>GPA: </strong><span id="grade-dist-gpa"></span></li>' +
                    '</ul>' +
                '</div>' +
                '<div class="no-data">No data could be found for this professor</div>' +
                '<div class="loading-data">Loading data...</div>' +
            '</div>' +
        '</div>'
    );

    return gradeDist
}

function formatGradeDist(data) {
    gradeDist.find('.loading-data').hide();

    if (data) {
        gradeDist.find('.yes-data').show();
        gradeDist.find('h3').html('<a href="'+data.url+'" target="_blank">Grade Distribution</a>');

        gradeDist.find('#grade-dist-a').text(data.aPercent);
        gradeDist.find('#grade-dist-b').text(data.bPercent);
        gradeDist.find('#grade-dist-c').text(data.cPercent);
        gradeDist.find('#grade-dist-d').text(data.dPercent);
        gradeDist.find('#grade-dist-f').text(data.fPercent);
        gradeDist.find('#grade-dist-w').text(data.wPercent);
        gradeDist.find('#grade-dist-gpa').text(data.gpa);
    } else {
        gradeDist.find('h3').html('Grade Distribution');
        gradeDist.find('.no-data').show();
    }
}

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
            formatGradeDist(null);
            callback();
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
            mostRecent.url = url;
            formatGradeDist(mostRecent);
            callback();
        }
    });
}
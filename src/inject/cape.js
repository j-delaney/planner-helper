var cape = null;

function makeCapeSection() {
    cape = $(
        '<div class="section">' +
            '<h3>CAPE</h3>' +
            '<div id="cape">' +
                '<div class="yes-data">' +
                    '<ul>' +
                        '<li><strong>Enrolled: </strong><span id="cape-enrolled"></span></li>' +
                        '<li><strong>Evals Made: </strong><span id="cape-evals"></span></li>' +
                        '<li><strong>Recommend Class: </strong><span id="cape-rcmd-class"></span></li>' +
                        '<li><strong>Recommend Instructor: </strong><span id="cape-rcmd-instr"></span></li>' +
                        '<li><strong>Study Hours/Week</strong><span id="cape-study-hrs"></span></li>' +
                    '</ul>' +
                '</div>' +
                '<div class="no-data">No data could be found for this professor</div>' +
                '<div class="loading-data">Loading data...</div>' +
            '</div>' +
        '</div>'
    );

    return cape;
}

function formatCape(data) {
    cape.find('.loading-data').hide();

    if (data) {
        cape.find('.yes-data').show();

        cape.find('h3').html('<a href="'+data.url+'" target="_blank">CAPE</a>');

        cape.find('#cape-enrolled').text(data.enroll);
        cape.find('#cape-evals').text(data.evalsMade);
        cape.find('#cape-rcmd-class').text(data.recommendClass);
        cape.find('#cape-rcmd-instr').text(data.recommendInstructor);
        cape.find('#cape-study-hrs').text(data.studyHours);
    } else {
        cape.find('h3').html('CAPE');
        cape.find('.no-data').show();
    }
}

function getCape(teacher, course, callback) {
    var url = 'http://cape.ucsd.edu/responses/Results.aspx?' +
        'Name=' + encodeURIComponent(teacher.nomiddle)+
        '&CourseNumber=' + course.subjectCode + course.courseCode;

    chrome.runtime.sendMessage({
        method: 'GET',
        action: 'xhttp',
        url: url
    }, function(html) {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(html, "text/html");
        var page = $(htmlDoc);

        if (page.find('#ctl00_ContentPlaceHolder1_gvCAPEs_ctl01_lblEmptyData').length) {
            formatCape(null);
            callback();
        } else {
            var result = page.find('#ctl00_ContentPlaceHolder1_gvCAPEs').children('tbody').children().first().children();

            var data = {
                enroll: $(result[3]).text(),
                evalsMade: $(result[4]).text(),
                recommendClass: $(result[5]).text(),
                recommendInstructor: $(result[6]).text(),
                studyHours: $(result[7]).text(),
                avgGradeExpected: $(result[8]).text(),
                avgGradeReceived: $(result[9]).text(),
                url: url
            };

            formatCape(data);
            callback();
        }
    });
}
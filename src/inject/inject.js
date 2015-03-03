function parseQuery(query) {
    query = query.substr(1); //Remove the ? at the beginning
    var vars = query.split('&');
    var params = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return params;
}

function parseCourseID(courseID) {
    var matches = courseID.match(/([A-Za-z]*)(.*)/);
    if (matches && matches.length === 3) {
        return [matches[1], matches[2]];
    } else {
        return false;
    }
}

function parseTeacherName(teacher) {
    var matches = teacher.match(/(\w*),\s(\w*)/);
    if (!matches || matches.length < 3) {
        return false;
    }
    return {
        fullname: teacher,
        nomiddle: matches[1] + ', ' + matches[2],
        fname: matches[2],
        lname: matches[1]
    };
}

function findTeacherName() {
    var teacher = $('#listing').find('ul.courseinfo').children('li').first().text();
    return parseTeacherName(teacher);
}

function findClass(params) {
    var result = parseCourseID(params['courseid']);
    if (!result || result.length !== 2) {
        console.error('Problem parsing course ID: ' + params);
        return false;
    }

    return {
        subjectCode: result[0],
        courseCode: result[1]
    }
}

function getGradeDistribution(teacher, course) {
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

        tableRows.each(function (i, elem) {
            var cells = $(elem).children();
            var gpa = $(cells[5]).text();
            var aPercent = $(cells[6]).text();
            var bPercent = $(cells[7]).text();
            var cPercent = $(cells[8]).text();
            var dPercent = $(cells[9]).text();
            var fPercent = $(cells[10]).text();
            var wPercent = $(cells[11]).text();
            console.log(gpa, aPercent, bPercent, cPercent, dPercent, fPercent, wPercent);
        });
    });
}

$(document).ready(function () {
    $('#listing').on('click', 'a', function (event) {
        var a = $(event.target)[0];
        var params = parseQuery(a.search);

        if ('sectionletter' in params) { //Viewing a teacher
            var teacher = findTeacherName();
            var course = findClass(params);

            getGradeDistribution(teacher, course);
        }
    });
});
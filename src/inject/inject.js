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
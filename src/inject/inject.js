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

function findTeacherName(page) {
    var teacher = $('#listing').find('ul.courseinfo').children('li').first().text();
    return parseTeacherName(teacher);
}

function findClass(params, page, a) {
    var courseid;
    if (page === 'Select') {
        courseid = $(a).text();
    } else {
        courseid = params['courseid'];
    }
    var result = parseCourseID(courseid);
    if (!result || result.length !== 2) {
        console.error('Problem parsing course ID: ' + params);
        return false;
    }

    return {
        subjectCode: result[0],
        courseCode: result[1]
    }
}

var plannerHelper = null;

function formatBase(teacher, course) {
    plannerHelper.find('h2').text('Planner Helper Data for ' + teacher.fname + ' ' + teacher.lname + ', ' + course.subjectCode + course.courseCode);
}

function waitUntilDoneLoading(fn) {
    if ($('#loading').is(':hidden')) {
        fn();
    } else {
        setTimeout(function () {
            return waitUntilDoneLoading(fn);
        }, 100);
    }
}

function reloadData(params, page, a) {
    waitUntilDoneLoading(function () {
        var teacher = findTeacherName(page);
        var course = findClass(params, page, a);

        plannerHelper.find('.yes-data').hide();
        plannerHelper.find('.no-data').hide();
        plannerHelper.find('.loading-data').show();

        formatBase(teacher, course);
        getRMP(teacher, function () {});
        getCape(teacher, course, function () {});
        getGradeDistribution(teacher, course, function () {});

        $('#planner-helper-data').show();
        $('#planner-helper-nodata').hide();
    });
}

$(document).ready(function () {
     plannerHelper = $(
        '<div id="planner-helper">' +
            '<h2>Planner Helper Data</h2>' +
            '<div id="planner-helper-data">' +
            '</div>' +
            '<div id="planner-helper-nodata">First select a professor to see data about them</div>' +
        '</div>'
    );

    $('#tdr_content_content').children().first().after(plannerHelper);
    plannerHelper.find('#planner-helper-data').append(makeRMPSection());
    plannerHelper.find('#planner-helper-data').append(makeCapeSection());
    plannerHelper.find('#planner-helper-data').append(makeGradeDistSection());

    $('#listing').on('click', 'a', function (event) {
        var a = $(event.target)[0];
        var params = parseQuery(a.search);

        if ('sectionletter' in params) { //Viewing a teacher
            reloadData(params, 'Default', a);
        }
    });

    $('#calendar').on('click', 'a', function (event) {
        var a = $(event.target)[0];
        var params = parseQuery(a.search);

        if (params.jlinkevent === 'Select') {
            reloadData(params, 'Select', a);
        }
    });
});

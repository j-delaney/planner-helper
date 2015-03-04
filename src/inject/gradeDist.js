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

        tableRows.each(function (i, elem) {
            var termCode = $(cells[0]).text(); //e.g. SP13
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
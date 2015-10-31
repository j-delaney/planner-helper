function GradeDist(errorHandler) {
    DataSection.call(this, 'Grade Distribution', 'grade-dist', [
        {label: 'A', dataField: 'aPercent'},
        {label: 'B', dataField: 'bPercent'},
        {label: 'C', dataField: 'cPercent'},
        {label: 'D', dataField: 'dPercent'},
        {label: 'F', dataField: 'fPercent'},
        {label: 'W', dataField: 'wPercent'},
        {label: 'GPA', dataField: 'gpa'}
    ], 'Grade Distribution data does not exist for this professor.', errorHandler);
}

GradeDist.prototype = Object.create(DataSection.prototype);
GradeDist.prototype.constructor = GradeDist;

GradeDist.prototype.getNewData = function (teacher, course, callback) {
    var url = 'http://asucsd.ucsd.edu/gradeDistribution?' +
        'GradeDistribution%5BTERM_CODE%5D=' +
        '&GradeDistribution%5BSUBJECT_CODE%5D='+ course.subjectCode +
        '&GradeDistribution%5BCOURSE_CODE%5D=' + course.courseCode +
        '&GradeDistribution%5BCRSE_TITLE%5D=' +
        '&GradeDistribution%5BINSTRUCTOR%5D=' + encodeURIComponent(teacher.nomiddle) +
        '&GradeDistribution%5BGPA%5D=' +
        '&GradeDistribution_page=1' +
        '&ajax=gradedistribution-grid';

    this.fetchHTMLHttp(url, function (page) {
        if (!page) {
            this.errorHandler.warning('Grade Distribution', {
                teacher: teacher,
                course: course,
                url: url
            });
            this.data = null;
            return callback();
        }

        var tableRows;
        try {
            tableRows = page.find('#gradedistribution-grid').children('table.items').children('tbody').children();
        } catch (e) {
            this.errorHandler.invariant();
            this.data = null;
            return callback();
        }

        if (tableRows.length === 0) {
            this.errorHandler.invariant();
            this.data = null;
            return callback();
        }

        // If empty results then return that no data could be found.
        try {
            if (tableRows.first().children().first().hasClass('empty')) {
                this.errorHandler.warning('Grade Distribution', {
                    teacher: teacher,
                    course: course,
                    url: url
                });
                this.data = null;
                return callback();
            }
        } catch (e) {
            this.errorHandler.invariant();
            this.data = null;
            return callback();
        }

        var gradeDists = [];
        // Save `this` to that.
        var that = this;
        var abort = false;
        $(tableRows).each(function (i, tr) {
            var cells = $(tr).children();

            if (cells.length <= 11) {
                that.errorHandler.invariant();
                that.data = null;
                abort = true;
                return;
            }

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

        if (abort) {
            return callback();
        }

        this.data = getMostRecent(gradeDists);
        this.data.url = url;
        callback();
    }.bind(this))
};

/**
 * Takes a list of grade distribution rows and returns whichever one is the most recent.
 * @param gradeDists
 */
function getMostRecent(gradeDists) {
    //TODO: Just sort by Term Code and remove this whole function
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
function Cape(errorHandler) {
    DataSection.call(this, 'CAPE', 'cape', [
        {label: 'Enrolled', dataField: 'enrolled'},
        {label: 'Evals Made', dataField: 'evalsMade'},
        {label: 'Recommend Class', dataField: 'recommendClass'},
        {label: 'Recommend Instructor', dataField: 'recommendInstructor'},
        {label: 'Study Hours/Week', dataField: 'studyHours'}
    ], errorHandler);
}

Cape.prototype = Object.create(DataSection.prototype);
Cape.prototype.constructor = Cape;

Cape.prototype.getNewData = function (teacher, course, callback) {
    var url = 'https://cape.ucsd.edu/responses/Results.aspx?' +
        'Name=' + encodeURIComponent(teacher.nomiddle)+
        '&CourseNumber=' + course.subjectCode + course.courseCode;

    this.fetchHTML(url, function (page) {
        // If no page object or there are no results to show
        if (!page || page.find('#ctl00_ContentPlaceHolder1_gvCAPEs_ctl01_lblEmptyData').length) {
            this.errorHandler.warning('CAPE', {
                teacher: teacher,
                course: course,
                url: url
            });
            this.data = null;
            return callback();
        }

        var result;
        try {
            result = page.find('#ctl00_ContentPlaceHolder1_gvCAPEs').children('tbody').children().first().children();
        } catch (e) {
            this.errorHandler.invariant();
            this.data = null;
            return callback();
        }

        if (result.length <= 9) {
            this.errorHandler.invariant();
            this.data = null;
            return callback();
        }

        this.data = {
            enrolled: $(result[3]).text(),
            evalsMade: $(result[4]).text(),
            recommendClass: $(result[5]).text(),
            recommendInstructor: $(result[6]).text(),
            studyHours: $(result[7]).text(),
            avgGradeExpected: $(result[8]).text(),
            avgGradeReceived: $(result[9]).text(),
            url: url
        };

        return callback();
    }.bind(this));
};
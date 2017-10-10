function GradeDist(errorHandler) {
    DataSection.call(this, 'Grade Distributions', 'grade-dist', [
        {label: 'A', dataField: 'aGrade'},
        {label: 'B', dataField: 'bGrade'},
        {label: 'C', dataField: 'cGrade'},
        {label: 'D', dataField: 'dGrade'},
        {label: 'F', dataField: 'fGrade'},
        {label: 'P', dataField: 'pGrade'},
        {label: 'NP', dataField: 'npGrade'}
    ],'Grade Distribution data does not exist for this professor or there was an error obtaining it.', errorHandler);
}

GradeDist.prototype = Object.create(DataSection.prototype);
GradeDist.prototype.constructor = GradeDist;

GradeDist.prototype.getNewData = function (teacher, course, callback) {

    var url = "http://cape.ucsd.edu/responses/Results.aspx?Name=" 
                    + teacher.lname 
                    + "%2C+" 
                    + teacher.fname 
                    + "&CourseNumber="
                    + course.subjectCode
                    + "+" 
                    + course.courseCode

    this.fetchHTMLHttp(url, function(page){
        let hrefValue = page.find('#ctl00_ContentPlaceHolder1_gvCAPEs_ctl02_hlViewReport').attr('href')
        let sectionID = hrefValue.slice(-6);
        let gradeDistURL = "http://cape.ucsd.edu/responses/CAPEReport.aspx?sectionid=" + sectionID;

        this.fetchHTMLHttp(gradeDistURL, function(data){
            let result = data.find('#ctl00_ContentPlaceHolder1_tblGradesReceived').children('tbody').children().children();

            this.data = {
                aGrade : $(result[7]).text(),
                bGrade : $(result[8]).text(),
                cGrade : $(result[9]).text(),
                dGrade : $(result[10]).text(),
                fGrade : $(result[11]).text(),
                pGrade : $(result[12]).text(),
                npGrade: $(result[13]).text(),
                url: url
            }
            return callback();
        }.bind(this));
    }.bind(this));
};

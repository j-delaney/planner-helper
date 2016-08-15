function GradeDist(errorHandler) {
    DataSection.call(this, 'Grade Distribution', 'grade-dist', [
        {label: 'A', dataField: 'aPercent'},
        {label: 'B', dataField: 'bPercent'},
        {label: 'C', dataField: 'cPercent'},
        {label: 'D', dataField: 'dPercent'},
        {label: 'F', dataField: 'fPercent'},
        {label: 'P', dataField: 'pPercent'},
        {label: 'NP', dataField: 'npPercent'}
    ], 'Grade Distribution data does not exist for this professor.', errorHandler);
}

GradeDist.prototype = Object.create(DataSection.prototype);
GradeDist.prototype.constructor = GradeDist;

GradeDist.prototype.getNewData = function (teacher, course, callback) {
    // link to professor's cape.ucsd.edu site in order to get their 6 digit page number 
    // YQL Query URL: select href from html where url = 'https://cape.ucsd.edu/responses/Results.aspx?Name=mirza%2Cdiba&CourseNumber=cse30' and xpath = '//*[@id="ctl00_ContentPlaceHolder1_gvCAPEs_ctl02_hlViewReport"]'
    var link = "https://query.yahooapis.com/v1/public/yql?q=select%20href%20from%20html%20where%20url%3D%22https%3A%2F%2Fcape.ucsd.edu%2Fresponses%2FResults.aspx%3FName%3D" 
        + teacher.lname + "%252C%2B" + teacher.fname + "%26CourseNumber%3D" 
        + course.subjectCode + course.courseCode + "%22%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22ctl00_ContentPlaceHolder1_gvCAPEs_ctl02_hlViewReport%22%5D'&format=json&diagnostics=true&callback=";
    var jsonObj;
    
    // Create an XMLHttpRequest object to obtain data from websites
    var request = new XMLHttpRequest();  
    var sectionID = getSectionID(request, link);
    // url to allow the user to go to the cape.ucsd.edu grade distribution site 
    var url = "http://cape.ucsd.edu/responses/CAPEReport.aspx?sectionid=" + sectionID;

    // get grade distribution data and display it to the user
    // YQL Query URL: select td from html where url = 'https://cape.ucsd.edu/responses/CAPEReport.aspx?sectionid=849783' and xpath = '//*[@id="ctl00_ContentPlaceHolder1_tblGradesReceived"]/tbody/tr[2]'
    link = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%20%3D%20'https%3A%2F%2Fcape.ucsd.edu%2Fresponses%2FCAPEReport.aspx%3Fsectionid%3D" 
            + sectionID 
            + "'%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22ctl00_ContentPlaceHolder1_tblGradesReceived%22%5D%2Ftbody%2Ftr%5B2%5D'&format=json&diagnostics=true&callback=";
    
    request.open('GET', link, false);
    request.send(null);

    // only scrape the data if the page has successfully been retrieved and there is a sectionID
    if(request.status == 200 && request.readyState == 4 && sectionID !== ""){
        jsonObj = JSON.parse(request.responseText);
        try{ 
            this.data = {
                // display data from cape website
                aPercent: jsonObj.query.results.tr.td[0],
                bPercent: jsonObj.query.results.tr.td[1],
                cPercent: jsonObj.query.results.tr.td[2],
                dPercent: jsonObj.query.results.tr.td[3],
                fPercent: jsonObj.query.results.tr.td[4],
                pPercent: jsonObj.query.results.tr.td[5],
                npPercent:jsonObj.query.results.tr.td[6],
                url: url
            };        
        }
        catch(TypeError){
            console.log("There was a TypeError getting the grade data");
        }
    }
    else{
        console.log("Error loading grade dist info from cape.ucsd.edu. Compare the professor's name in the teacher param with cape.ucsd.edu");
        // Display: "Grade Distribution data does not exist for this professor" instead of incorrect prof grade dist data
        this.data = null;
    }
    return callback();
};
/**
 * Retrieves section ID - grade distribution data is available with a unique 6
 * digit sectionID in the url  
 * 
 * @param request - XMLHttpRequest object to get data with
 * @param link - cape.ucsd.edu link to extract sectionID value from
 * @return returns sectionID if successful, returns empty string if not
 */
function getSectionID(request, link){
    request.open('GET', link, false);  // `false` makes the request synchronous
    request.send(null);
    // only scrape the data if the page has successfully been retrieved
    if (request.status == 200 && request.readyState == 4) {
        try{
            var jsonObj = JSON.parse(request.responseText);
            var hrefValue = jsonObj.query.results.a.href;
            // the section ID is the last 6 characters of hrefValue
            return hrefValue.substr(hrefValue.length-6);
        }
        catch(TypeError){
            console.log("TypeError getting the href value");
            // return empty string as a result
            return "";
        }
    }
    else{
        console.log("something went wrong");
        // return empty string as a result
        return "";
    }   
}

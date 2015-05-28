/**
 * Creates a new data section - an element to display data about a professor from a certain source.
 * Just creating the object will not put it onto the page. To do that, you must add `dataSection.elements.main`
 * to the page.
 *
 * @constructor
 * @param {string} title The title to use to identify the section.
 * @param {string} id The unique id used for this section. Must be a valid CSS ID.
 * @param {{label, dataField}[]} fields An array of ojects with the format {label, dataField} where label
 * is the text to use on the `page` and `dataField` is the key that will hold the relevant data in `this.data`
 */
function DataSection(title, id, fields) {
    //Object of most recently fetched data for this section
    this.data = null;
    //URL the user can click to see the most recently fetched data from the original source
    this.url = null;
    //Cache of all previously requested data with the key being "<subjectCode><courseCode> <fullname>"
    this.cache = {};
    //The current course being parsed. To prevent race conditions hopefully
    this.currentCourse = '';

    //Object of elements relevant to this section
    this.elements = {};

    this.title = title;
    this.id = id;
    this.fields = fields;

    this.createElements();
}

/**
 * Creates the needed elements for this section. Does not add the elements to the page.
 *
 * @private
 */
DataSection.prototype.createElements = function () {
    this.elements.noData = $('<div class="no-data">No data could be found for this professor</div>');
    this.elements.loadingData = $('<div class="loading-data">Loading data...</div>');
    this.elements.yesData = $('<div class="yes-data"></div>');
    this.elements.yesData.append(this.createDataList());
    this.elements.errorData = $('<div class="error-data">There was an unexpected error fetching your data.</div>');
    this.elements.title = $('<h3>' + this.title + '</h3>');

    this.elements.main = $('<div class="section"></div>');

    this.elements.main.append(this.elements.title,
        this.elements.yesData,
        this.elements.noData,
        this.elements.loadingData,
        this.elements.errorData
    );

    //Hide all the fields
    this.elements.yesData.hide();
    this.elements.noData.hide();
    this.elements.loadingData.hide();
    this.elements.errorData.hide();
};

/**
 * Creates the HTML for displaying this section's data based on the fields variable.
 *
 * @private
 * @returns {string} The HTML for the data list.
 */
DataSection.prototype.createDataList = function () {
    var dataList = $('<ul></ul>');
    for (var key in this.fields) {
        if (this.fields.hasOwnProperty(key)) {
            this.fields[key].element = $('<span></span>');
            var tmpObject = $(
                '<li>' +
                    '<strong>' + this.fields[key].label + ': </strong>' +
                '</li>'
            );
            tmpObject.append(this.fields[key].element);
            dataList.append(tmpObject);
        }
    }
    return dataList;
};

/**
 * Makes an async GET request to the given URL. If the request fails the page will will display
 * and log an error.
 *
 * @protected
 * @param url The URL to get data from.
 * @param callback A callback function with one param `data` that contains the response data or
 * `null` if the request failed.
 */
DataSection.prototype.fetchData = function (url, callback) {
    //Because of JS scoping we lose `this` upon entering the callback below
    var that = this;

    chrome.runtime.sendMessage({
        method: 'GET',
        action: 'xhttp',
        url: url
    }, function (xhttp) {
        callback(xhttp.responseText);
    })
};

/**
 * Makes an async GET request to the given URL. Takes the HTML response and converts it into
 * a virtual jQuery object. If the request fails the page will display and log an error.
 *
 * @protected
 * @param url The URL to get data from.
 * @param callback A callback function with one param `page` that either contains the jQuery object or
 * `null` if the request failed.
 */
DataSection.prototype.fetchHTML = function (url, callback) {
    //Because of JS scoping we lose `this` upon entering the callback below
    var that = this;

    chrome.runtime.sendMessage({
        method: 'GET',
        action: 'xhttp',
        url: url
    }, function (xhttp) {
        //Convert the returned HTML into a virtual jQuery object
        //We need to do it in this method so it doesn't load all resources (images, css, ...)
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(xhttp.responseText, "text/html");
        var page = $(htmlDoc);

        callback(page);
    })
};

/**
 * Gets the new data and puts it in `this.data` (or sets it to null if no data could be found). Does nothing,
 * meant to be overwritten.
 *
 * @protected
 * @param teacher A teacher object containg the fields fullname, nomiddle, fname, lname.
 * @param course A course object containg the fields subjectCode, courseCode.
 * @param callback The function to call upon completing the update.
 */
DataSection.prototype.getNewData = function (teacher, course, callback) {
    callback();
};

/**
 * Updates the data for this section given a certain teacher and course.
 *
 * @public
 * @param {{}} teacher A teacher object containg the fields fullname, nomiddle, fname, lname.
 * @param {{}} course A course object containg the fields subjectCode, courseCode.
 * @param callback The function to call upon completing the update.
 */
DataSection.prototype.updateData = function (teacher, course, callback) {
    this.elements.yesData.slideUp(250);
    this.elements.noData.slideUp(250);
    this.elements.errorData.slideUp(250);
    this.elements.loadingData.slideDown(250);

    var cacheName = course.subjectCode + course.courseCode + ' ' + teacher.fullname;
    this.currentCourse = cacheName;

    if (cacheName in this.cache) {
        this.data = this.cache[cacheName];
        this.updateUI(cacheName);
        callback();
    } else {
        this.getNewData(teacher, course, function () {
            this.cache[cacheName] = this.data;
            this.updateUI(cacheName);
            callback();
        }.bind(this));
    }
};

/**
 * Updates the UI to include the values in `this.data`.
 *
 * @private
 * @param cacheName The cache name of the course we're updating for.
 */
DataSection.prototype.updateUI = function (cacheName) {
    //If we're trying to update the UI for data that no longer matters then stop
    if (cacheName !== this.currentCourse) {
        return;
    }

    this.elements.loadingData.slideUp(500);

    if (this.data) {
        //Set all the fields
        for (var key in this.fields) {
            if (this.fields.hasOwnProperty(key)) {
                var newValue = this.data[this.fields[key].dataField];
                this.fields[key].element.text(newValue);
            }
        }

        //Show the data
        this.elements.yesData.slideDown(500);

        //Change the title to be a link
        this.elements.title.html('<a href="' + this.data.url + '" target="_blank">' + this.title + '</a>');
    } else {
        this.elements.title.html(this.title);
        this.elements.noData.slideDown(500);
    }
};
function PlannerHelper() {
    this.rmp = new RMP();
    this.gradeDist = new GradeDist();
    this.cape = new Cape();

    this.element = null;

    this.createElement();
}

/**
 * Creates the main element. Does not add it to the page.
 *
 * @private
 */
PlannerHelper.prototype.createElement = function () {
    this.element = $(
        '<div id="planner-helper">' +
            '<h2>Planner Helper Data</h2>' +
            '<div id="planner-helper-data"></div>' +
            '<div id="planner-helper-nodata">First select a professor to see data about them</div>' +
        '</div>'
    );
    this.element.find('#planner-helper-data').append(this.rmp.elements.main, this.cape.elements.main, this.gradeDist.elements.main);
};

/**
 * We can't fetch data from the page until the sidebar with course info is done loading. This function
 * waits until the loading icon is gone (i.e. the new data is done loading) and then calls the callback.
 *
 * @private
 * @param fn The callback function to call when the page is done loading.
 */
PlannerHelper.prototype.waitUntilDoneLoading = function (fn) {
    if ($('#loading').is(':hidden')) {
        fn();
    } else {
        setTimeout(function () {
            return this.waitUntilDoneLoading(fn);
        }.bind(this), 100);
    }
};

/**
 * Takes an event generated from a click event and extracts the parameters from the link as well as the link text into
 * an object.
 *
 * @private
 * @param event The event generated from the user clicking on a link.
 * @returns {{}} The params extracted from the link as well as a field called `text` containing the link text.
 */
PlannerHelper.prototype.parseClickedLink = function (event) {
    var a = $(event.target)[0];
    var query = a.search.substr(1); //Remove the ? at the beginning

    var vars = query.split('&');
    var params = {
        text: $(a).text()
    };
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return params;
};

/**
 * Finds the data for the currently listed teacher.
 *
 * @private
 * @returns {{}|boolean} An object containing the teacher data (fullname, nomiddle, fname, and lname) or `false`
 * if no data could be found.
 */
PlannerHelper.prototype.getTeacher = function () {
    var fullname = $('#listing').find('ul.courseinfo').children('li').first().text();

    var matches = fullname.match(/(\w*),\s(\w*)/); //LAST:_1, FIRST:_2 MIDDLE
    if (!matches || matches.length < 3) {
        return false;
    }

    return {
        fullname: fullname,
        nomiddle: matches[1] + ', ' + matches[2],
        fname: matches[2],
        lname: matches[1]
    };
};

/**
 * Finds the data for the currently listed course.
 *
 * @private
 * @param params The extracted params from the clicked link. Must include the `text` field.
 * @returns {{}|boolean} An object containing the course data (subjectCode and courseCode) or `false` if no data
 * could be found.
 */
PlannerHelper.prototype.getCourse = function (params) {
    var courseid = params.jlinkevent === 'Select' ? params.text : params['courseid'];

    var matches = courseid.match(/([A-Za-z]*)(.*)/);
    if (matches && matches.length === 3) {
        return {
            subjectCode: matches[1],
            courseCode: matches[2]
        };
    } else {
        return false;
    }
};

PlannerHelper.prototype.reloadData = function (event) {
    var params = this.parseClickedLink(event);
    if (params.jlinkevent === 'Select' || params.jlinkevent === 'Subsections') {
        this.waitUntilDoneLoading(function () {
            var teacher = this.getTeacher();
            var course = this.getCourse(params);

            this.element.find('h2').text('Planner Helper Data for ' + teacher.fname + ' ' + teacher.lname + ', ' + course.subjectCode + course.courseCode);

            this.rmp.updateData(teacher, course, function () {});
            this.cape.updateData(teacher, course, function () {});
            this.gradeDist.updateData(teacher, course, function () {});

            $('#planner-helper-data').show();
            $('#planner-helper-nodata').hide();
        }.bind(this));
    }
};
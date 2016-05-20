function PlannerHelper() {
    this.errorHandler = new ErrorHandler(this);

    this.rmp = new RMP(this.errorHandler);
    this.gradeDist = new GradeDist(this.errorHandler);
    this.cape = new Cape(this.errorHandler);

    this.teacher = null;
    this.course = null;

    this.element = null;

    // jQuery elements that we will be using.
    this.$searchDiv = null;
    this.$searchContainer = null;

    // Whether the extension has aborted execution. This happens when an invariant has failed,
    // meaning that something has changed that will possibly cause issues in the extension.
    this.aborted = false;

    this.createElement();

    this.init();
}

/**
 * Initialize and test some variables that we need.
 * @private
 */
PlannerHelper.prototype.init = function () {
    // Insert the main element into the page
    this.$searchDiv = $('#search-div-0');
    this.errorHandler.invariant(this.$searchDiv.length, 1);
    this.$searchDiv.after(this.element);

    this.$searchContainer = $('#search-div-b-div');
    this.errorHandler.invariant(this.$searchContainer.length, 1);

    this.enableSearchEvent();
};

/**
 * @private
 */
PlannerHelper.prototype.enableSearchEvent = function () {
    this.$searchContainer.on('DOMNodeInserted', _.debounce(this.attachButtonToSearchResults, 300).bind(this));
};

/**
 * @private
 */
PlannerHelper.prototype.disableSearchEvent = function () {
    this.$searchContainer.off('DOMNodeInserted');
};

/**
 * Takes a row from the search results and returns an object of the data associated with that row.
 * Since each cell in the row has an 'aria-describedby' property we can use that for the property
 * name.
 * @private
 */
PlannerHelper.prototype.getDataFromRow = function ($row) {
    var data = {};

    $row.children().each(function (index, cellElement) {
        var $cell = $(cellElement);
        var cellDesc = $cell.attr('aria-describedby');
        if (typeof cellDesc !== 'undefined') {
            data[cellDesc] = $cell.text();
        }
    });

    return data;
};

/**
 * Creates a button that will show a teacher's data if it's clicked.
 * @returns {jQuery}
 */
PlannerHelper.prototype.makeViewDataButton = function (teacher, course) {
    // Save `this` as plannerHelper to prevent it being lost in the anonymous function.
    var plannerHelper = this;

    var button = $('<input class="view-data" type="button" value="View Data" />');
    button.data('course', course);
    button.data('teacher', teacher);
    button.on('click', function () {
        plannerHelper.reloadData($(this).data('teacher'), $(this).data('course'));
        $('html, body').animate({
            scrollTop: $("#planner-helper").offset().top
        }, 1000);
    });

    return button
};

/**
 * Goes through all the search results and attaches the "View Data" button to them.
 * @private
 */
PlannerHelper.prototype.attachButtonToSearchResults = function () {
    // Prevent firing this event while running this event (causing an infinite loop).
    this.disableSearchEvent();

    // If the extensions has aborted, do nothing.
    if (this.aborted) {
        return;
    }

    // Get the rows from the search results.
    var $searchResults;
    try {
        $searchResults = $('#search-div-b-table').children('tbody').children();
    } catch (e) {
        this.errorHandler.invariant();
    }

    $searchResults.each(function (index, rowElement) {
        var $row = $(rowElement);
        if ($row.hasClass('wr-search-batch-middle') || $row.hasClass('wr-search-ac-alone')) {
            var cellData = this.getDataFromRow($row);

            // Verify that the course data we need is there.
            this.errorHandler.invariant(cellData.hasOwnProperty('search-div-b-table_SUBJ_CODE'));
            this.errorHandler.invariant(cellData.hasOwnProperty('search-div-b-table_CRSE_CODE'));

            // Get the subject code and course code (e.g. CSE and 3, respectively) from the cellData.
            var course = {
                subjectCode: cellData['search-div-b-table_SUBJ_CODE'],
                courseCode: cellData['search-div-b-table_CRSE_CODE']
            };

            // Verify that the teacher data we need is there.
            this.errorHandler.invariant(cellData.hasOwnProperty('search-div-b-table_PERSON_FULL_NAME'));

            // Get the teacher's full name from the cell data.
            var fullname = cellData['search-div-b-table_PERSON_FULL_NAME'];

            // Parse the teacher's full name into first, middle, and last.
            var matches = fullname.match(/(\w*),\s(\w*)/); //LAST:_1, FIRST:_2 MIDDLE
            if (!matches || matches.length < 3) {
                this.errorHandler.warning('Teacher Parse', {
                    fullname: fullname
                });
                return;
            }
            var teacher = {
                fullname: fullname,
                nomiddle: matches[1] + ', ' + matches[2],
                fname: matches[2],
                lname: matches[1]
            };

            // Add the button
            var button = this.makeViewDataButton(teacher, course);

            var $buttonArea = $row.children('[aria-describedby="search-div-b-table_colaction"]');
            this.errorHandler.invariant($buttonArea.length, 1);
            $buttonArea.append(button)
        }
    }.bind(this));

    // Reenable the search event now that we're done inserting new elements.
    this.enableSearchEvent();
};

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
            '<div id="planner-helper-nodata">To view a professor\'s data, click the "View Data" button ' +
            'that appears next to the professor\'s name in the search results.<br /><br />' +
            'If you encounter a bug or have any feature requests for the Planner Helper Chrome extension ' +
            'please feel free to <a href="mailto:jadelane@ucsd.edu">email me</a>. Please note that ' +
            'I am not a part of the WebReg team and bug reports for WebReg should not be sent to me.' +
            '</div>' +
        '</div>'
    );
    this.element.find('#planner-helper-data').append(this.rmp.elements.main, this.cape.elements.main, this.gradeDist.elements.main);
};

/**
 * Aborts execution of the Chrome extension. Used for when an invariant fails.
 *
 * @private
 */
PlannerHelper.prototype.abort = function () {
    this.aborted = true;

    var message = `
        Sorry, it appears that either WebReg or one of the data dependencies for Planner Helper
        have changed their format. An error report has been sent and an update will be released
        soon to make Planner Helper compatible with these changes.`;
    this.element.children('#planner-helper-data').text(message);
    this.disableSearchEvent();
};

/**
 * @private
 */
PlannerHelper.prototype.reloadData = function (teacher, course) {
    // Do nothing if we're trying to reload the data for the same prof and teacher
    if (JSON.stringify(this.teacher) === JSON.stringify(teacher) &&
        JSON.stringify(this.course) === JSON.stringify(course)) {
        return;
    }

    // We need to make a copy since Richard Ord will be changed to Rick Ord later and it will mess
    // up the equality check above.
    this.teacher = jQuery.extend({}, teacher);
    this.course = jQuery.extend({}, course);

    this.element.find('h2').text('Planner Helper Data for ' + teacher.fname + ' ' + teacher.lname + ', ' + course.subjectCode + course.courseCode);

    var rmpDeferred = $.Deferred();
    var capeDeferred = $.Deferred();
    var gradeDistDeferred = $.Deferred();

    this.rmp.updateData(teacher, course, rmpDeferred, function () {});
    this.cape.updateData(teacher, course, capeDeferred, function () {});
    this.gradeDist.updateData(teacher, course, gradeDistDeferred, function () {});

    var _rmp = this.rmp;
    var _cape = this.cape;
    var _gradeDist = this.gradeDist;

    $.when(rmpDeferred, capeDeferred, gradeDistDeferred).done(function () {
        _rmp.updateUI(_rmp.currentCourse);
        _cape.updateUI(_cape.currentCourse);
        _gradeDist.updateUI(_gradeDist.currentCourse);
    });

    $('#planner-helper-data').show();
    $('#planner-helper-nodata').hide();
};

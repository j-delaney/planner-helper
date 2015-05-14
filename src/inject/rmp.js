function RMP() {
    DataSection.call(this, 'Rate My Professor', 'rmp', [
        {label: 'Overall Quality', dataField: 'overallQuality'},
        {label: 'Helpfulness', dataField: 'helpfulness'},
        {label: 'Clarity', dataField: 'clarity'},
        {label: 'Easiness', dataField: 'easiness'}
    ]);

    //This is for teachers who have a different name on the class planner and RMP
    //When fetching data it will look if the teacher matches oldFName and oldLname and if they do
    //It will replace them with newFName and newLName
    this.teacherReplace = [
        {
            oldFName: 'Richard',
            oldLName: 'Ord',
            newFName: 'Rick',
            newLName: 'Ord'
        },
        {
            oldFName: 'Geoffrey',
            oldLName: 'Voelker',
            newFName: 'Geoff',
            newLName: 'Voelker'
        },
        {
            oldFName: 'Mor',
            oldLName: 'Kemp',
            newFName: 'Mia',
            newLName: 'Minnes-Kemp'
        },
        {
            oldFName: 'John',
            oldLName: 'Lee',
            newFName: 'John Hoon',
            newLName: 'Lee'
        },
        {
            oldFName: 'Ilkay',
            oldLName: 'Callaf',
            newFName: 'Ilkay',
            newLName: 'Altintas'
        }
    ]

}

RMP.prototype = Object.create(DataSection.prototype);
RMP.prototype.constructor = RMP;

/**
 * Checks if the teacher name is in `this.teacherReplace` and if so fixes their name.
 * @param teacher The Teacher name object. Will be modified.
 * @private
 */
RMP.prototype.checkTeacher = function (teacher) {
    this.teacherReplace.forEach(function (teacherCheck) {
        if (teacher.fname === teacherCheck.oldFName && teacher.lname === teacherCheck.oldLName) {
            teacher.fname = teacherCheck.newFName;
            teacher.lname = teacherCheck.newLName;
            return false; //Causes forEach to break
        }
        return true;
    });
};

RMP.prototype.getNewData = function (teacher, course, callback) {
    this.checkTeacher(teacher);

    var url = 'http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&callback=jQuery1110021761036990210414_1427756491821' +
        '&q=' + teacher.fname + '+' + teacher.lname +
        '&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20';

    this.fetchData(url, function (results) {
        if (!results) {
            this.data = null;
            return callback();
        }

        results = results.substr(results.indexOf('{'), results.length - results.indexOf('{') - 2);
        var json = JSON.parse(results);

        if (json.grouped.content_type_s.matches === 0) { //If no matches found
            this.data = null;
            callback();
        } else {
            var teachers = json.grouped.content_type_s.groups[0].doclist.docs;
            var teacher = false;
            for (var i in teachers) {
                if (teachers[i].schoolname_s === 'University of California San Diego') {
                    teacher = teachers[i].pk_id;
                    break;
                }
            }

            if (teacher) {
                this.getTeacherInfo(teacher, function (data) {
                    this.data = data;
                    callback();
                });
            } else {
                this.data = null;
                callback();
            }
        }
    }.bind(this))
};

RMP.prototype.getTeacherInfo = function (id, callback) {
    var url = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid=' + id;

    this.fetchHTML(url, function (page) {
        if (!page) {
            this.data = null;
            return callback();
        }

        var data = {};
        data.overallQuality = page.find('.rating-breakdown').find('.breakdown-wrapper').children().first().find('.grade').text();
        data.helpfulness = $(page.find('.rating-breakdown').find('.faux-slides').children()[0]).find('.rating').text();
        data.clarity = $(page.find('.rating-breakdown').find('.faux-slides').children()[1]).find('.rating').text();
        data.easiness = $(page.find('.rating-breakdown').find('.faux-slides').children()[2]).find('.rating').text();
        data.url = url;

        this.data = data;
        callback();
    }.bind(this));
};
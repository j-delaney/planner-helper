function RMP() {
    DataSection.call(this, 'Rate My Professor', 'rmp', [
        {label: 'Overall Quality', dataField: 'overallQuality'},
        {label: 'Helpfulness', dataField: 'helpfulness'},
        {label: 'Clarity', dataField: 'clarity'},
        {label: 'Easiness', dataField: 'easiness'}
    ]);
}

RMP.prototype = Object.create(DataSection.prototype);
RMP.prototype.constructor = RMP;

RMP.prototype.getNewData = function (teacher, course, callback) {
    //Rick Ord is listed as Richard Ord on the Class Planner but Rick on Rate My Professor
    if (teacher.lname === 'Ord' && teacher.fname === 'Richard') {
        teacher.fname = 'Rick';
    }

    var url = 'http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&callback=jQuery1110021761036990210414_1427756491821' +
        '&q=' + teacher.fname + '+' + teacher.lname +
        '&defType=edismax&qf=teacherfullname_t%5E1000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20';

    var that = this;

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
                that.getTeacherInfo(teacher, function (data) {
                    that.data = data;
                    callback();
                });
            } else {
                that.data = null;
                callback();
            }
        }
    })
};

RMP.prototype.getTeacherInfo = function (id, callback) {
    var url = 'http://www.ratemyprofessors.com/ShowRatings.jsp?tid=' + id;

    var that = this;

    this.fetchHTML(url, function (page) {
        if (!page) {
            that.data = null;
            return callback();
        }

        var data = {};
        data.overallQuality = page.find('.rating-breakdown').find('.breakdown-wrapper').children().first().find('.grade').text();
        data.helpfulness = $(page.find('.rating-breakdown').find('.faux-slides').children()[0]).find('.rating').text();
        data.clarity = $(page.find('.rating-breakdown').find('.faux-slides').children()[1]).find('.rating').text();
        data.easiness = $(page.find('.rating-breakdown').find('.faux-slides').children()[2]).find('.rating').text();
        data.url = url;

        that.data = data;
        callback();
    });
};
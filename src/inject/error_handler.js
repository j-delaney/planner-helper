function ErrorHandler(plannerHelper) {
    this.plannerHelper = plannerHelper;
}

ErrorHandler.prototype.invariant = function (actual, expected) {
    if (typeof expected === "undefined") {
        expected = true;

        if (typeof actual === "undefined") {
            actual = true;
        }
    }

    if (actual !== expected) {
        var e = new Error();
        this.log('Invariant Failure', 'Fatal', {
            actual: actual,
            expected: expected,
            stack: e.stack
        });
        this.plannerHelper.abort();
    }
};

ErrorHandler.prototype.warning = function (type, data) {
    this.log(type, 'Warning', data);
};

ErrorHandler.prototype.log = function (type, level, data) {
    data['type'] = type;
    data['level'] = level;

    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json',
        headers: {
            'Authorization': 'Basic ZTE3ZmM4MTYtMDI2Zi00MGU3LWJjMGQtYmYwNTQwMTZhZjU5Og=='
        },
        method: 'POST',
        url: 'https://api.ctl-uc1-a.orchestrate.io/v0/ph-errors'
    });
};

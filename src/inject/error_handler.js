function ErrorHandler(plannerHelper) {
    this.plannerHelper = plannerHelper;
}

ErrorHandler.prototype.invariant = function (actual, expected) {
    if (typeof expected === "undefined") {
        expected = true;
    }
    if (actual !== expected) {
        this.plannerHelper.abort();
        var e = new Error();
        logError({
            type: 'Verify failure',
            actual: actual,
            expected: expected,
            stack: e.stack
        });
    }
};

ErrorHandler.prototype.logError = function (data) {
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
}
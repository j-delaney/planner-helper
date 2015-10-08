$(document).ready(function () {
    // If this is the start page and not the actual webreg then stop the extension.
    if (window.location.href === 'https://act.ucsd.edu/webreg2/start') {
        return;
    }

    var plannerHelper = new PlannerHelper();
});

$(document).ready(function () {
    var href = window.location.href;

    if (href === 'https://act.ucsd.edu/classPlanner/planner' || href === 'http://act.ucsd.edu/classPlanner/planner') {
        return;
    }

    var plannerHelper = new PlannerHelper();

    $('#tdr_content_content').children().first().after(plannerHelper.element);

    $('#listing').on('click', 'a', function (event) {
        plannerHelper.reloadData(event);
    });
    $('#calendar').on('click', 'a', function (event) {
        plannerHelper.reloadData(event);
    });
});

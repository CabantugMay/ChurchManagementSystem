
// Mobile hamburger toggle for the tab navigation
(function () {
    // var hamburgerBtn = document.getElementById('hamburgerBtn');
    // var tabsRow = document.getElementById('tabsRow');
    // if (!hamburgerBtn || !tabsRow) return;

    // hamburgerBtn.addEventListener('click', function () {
    //     var isOpen = tabsRow.classList.toggle('open');
    //     hamburgerBtn.setAttribute('aria-expanded', isOpen);
    // });

    // // Close the menu after a tab is picked (mobile only)
    // tabsRow.querySelectorAll('.tab-btn').forEach(function (btn) {
    //     btn.addEventListener('click', function () {
    //         tabsRow.classList.remove('open');
    //         hamburgerBtn.setAttribute('aria-expanded', 'false');
    //     });
    // });
    
})();

$(document).on('change', '#reportMonth', function () {
    $('#mDate').val($('#reportMonth').val());
    sessionStorage.setItem('reportMonth', $('#reportMonth').val());
});


document.addEventListener('DOMContentLoaded', function () {
    const savedDate = sessionStorage.getItem('reportMonth');

    if (savedDate) {
        $('#reportMonth').val(savedDate);
    } else if (!$('#reportMonth').val()) {
        const today = new Date().toISOString().split('T')[0];

        $('#reportMonth').val(today);
        sessionStorage.setItem('reportMonth', today);
    }
});
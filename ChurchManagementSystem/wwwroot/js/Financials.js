document.addEventListener('DOMContentLoaded', function () {
    loadFinancials();
});

async function loadFinancials() {
    $('.member-tithes').remove();
    $('.member-rent').remove();

    const reportMonth = $('#reportMonth').val() == ""
        ? sessionStorage.getItem('reportMonth')
        : $('#reportMonth').val();

    $('#mDate').val(reportMonth);
    $('#mDate-Offerings').val(reportMonth);
    $('#mDate-Rent').val(reportMonth);

    const response = await fetch(
        `/Home/GetTithes?reportMonth=${encodeURIComponent(reportMonth)}`
    );

    if (!response.ok) {
        console.error('Failed to get members');
        return;
    }

    const Financials = await response.json();

    const memberlist = Financials[0];
    const OfferingList = Financials[1];
    const RentList = Financials[2];

    if (OfferingList[0] != undefined) {
        $('#offerings-amount').val(OfferingList[0].Amount);
    }

    const Tithes = document.getElementById('mFinancials');
    const Rent = document.getElementById('mFinancials-Rent');

    const inputMember = document.getElementById('tithes-members');
    const inputMemberRent = document.getElementById('Rent-members');

    const memberResults = document.getElementById('member-results');
    const memberResultsRent = document.getElementById('member-results-rent');

    // Hide results initially
    // memberResults.style.display = 'block';
    // memberResultsRent.style.display = 'block';

    // =========================
    // Hidden Member IDs
    // =========================

    const memberIdInput = document.createElement('input');
    memberIdInput.type = 'hidden';
    memberIdInput.classList.add('member-id');
    memberIdInput.name = "members";

    const memberIdInputRents = document.createElement('input');
    memberIdInputRents.type = 'hidden';
    memberIdInputRents.classList.add('member-id');
    memberIdInputRents.name = "members";

    Tithes.append(memberIdInput);
    Rent.append(memberIdInputRents);

    // =========================
    // Remove Duplicate Members
    // =========================

    const distinctMemberlist = [
        ...new Map(
            memberlist.map(member => [member.ID, member])
        ).values()
    ];

    // =========================
    // Create Member Option
    // =========================

    function createMemberOption(member, type) {

        const memberOption = document.createElement('div');

        memberOption.textContent = member.Member;
        memberOption.dataset.id = member.ID;

        if (type === 'tithes') {

            memberOption.classList.add('members-tooltip');

            memberOption.addEventListener('click', () => {

                inputMember.value = member.Member;
                memberIdInput.value = member.ID;

                memberResults.style.display = 'none';
            });

        } else {

            memberOption.classList.add('members-tooltip-rent');

            memberOption.addEventListener('click', () => {

                inputMemberRent.value = member.Member;
                memberIdInputRents.value = member.ID;

                memberResultsRent.style.display = 'none';
            });
        }

        return memberOption;
    }

    // =========================
    // Load Initial Member List
    // =========================

    function loadMemberResults() {

        memberResults.innerHTML = '';

        distinctMemberlist.forEach(member => {
            memberResults.appendChild(
                createMemberOption(member, 'tithes')
            );
        });
    }

    function loadRentMemberResults() {

        memberResultsRent.innerHTML = '';

        distinctMemberlist.forEach(member => {
            memberResultsRent.appendChild(
                createMemberOption(member, 'rent')
            );
        });
    }

    loadMemberResults();
    loadRentMemberResults();

    // =========================
    // Show / Hide Member Lists
    // =========================

    inputMember.onclick = (event) => {

        event.stopPropagation();

        memberResults.style.display = 'block';
        memberResultsRent.style.display = 'none';
    };

    inputMemberRent.onclick = (event) => {

        event.stopPropagation();

        memberResultsRent.style.display = 'block';
        memberResults.style.display = 'none';
    };

    // =========================
    // Search Tithes Members
    // =========================

    inputMember.oninput = () => {

        memberIdInput.value = '';

        const searchText = inputMember.value
            .toLowerCase()
            .trim();

        const filteredMembers = distinctMemberlist.filter(member =>
            member.Member
                .toLowerCase()
                .includes(searchText)
        );

        memberResults.innerHTML = '';

        filteredMembers.forEach(member => {

            memberResults.appendChild(
                createMemberOption(member, 'tithes')
            );

        });

        memberResults.style.display = 'block';
    };

    // =========================
    // Search Rent Members
    // =========================

    inputMemberRent.oninput = () => {

        memberIdInputRents.value = '';

        const searchText = inputMemberRent.value
            .toLowerCase()
            .trim();

        const filteredMembers = distinctMemberlist.filter(member =>
            member.Member
                .toLowerCase()
                .includes(searchText)
        );

        memberResultsRent.innerHTML = '';

        filteredMembers.forEach(member => {

            memberResultsRent.appendChild(
                createMemberOption(member, 'rent')
            );

        });

        memberResultsRent.style.display = 'block';
    };

    // =========================
    // Close When Clicking Outside
    // =========================

    document.onclick = (event) => {

        if (
            event.target !== inputMember &&
            !memberResults.contains(event.target)
        ) {
            memberResults.style.display = 'none';
        }

        if (
            event.target !== inputMemberRent &&
            !memberResultsRent.contains(event.target)
        ) {
            memberResultsRent.style.display = 'none';
        }
    };

    // =========================
    // Reports
    // =========================

    loadTithesReport(distinctMemberlist);
    loadRentReport(RentList);
}

function loadTithesReport(memberlist) {
    const TithesReport = document.getElementById('mFinancials-Report');
    let hasTithes = false;
    memberlist.forEach(member => {
        const Amount = member.Amount == null ? 0 : member.Amount.replaceAll(',', '');

        if (Amount > 0) {
            hasTithes = true;
            const TithesMembercontainer = document.createElement('div');

            TithesMembercontainer.classList.add('flex');
            TithesMembercontainer.classList.add('member-tithes');

            const TithesMember = document.createElement('input');
            TithesMember.value = member.Member
            TithesMember.classList.add('financials-report-members');
            TithesMember.disabled = true;

            const TithesAmount = document.createElement('input');
            TithesAmount.value = member.Amount;
            TithesAmount.classList.add('financials-report-amount');

            const DeleteChange = document.createElement('div');
            DeleteChange.classList.add('btn-delete-change');

            const TithesRemove = document.createElement('button');
            TithesRemove.classList.add('btn');
            TithesRemove.classList.add('btn-Delete');
            TithesRemove.id = member.ID;
            // TithesRemove.textContent = "Remove";

            const TithesChange = document.createElement('button');
            TithesChange.classList.add('btn');
            TithesChange.classList.add('btn-Save');
            TithesChange.id = member.ID;

            // TithesChange.textContent = "Change";

            TithesMembercontainer.append(TithesMember);
            TithesMembercontainer.append(TithesAmount);
            DeleteChange.append(TithesChange);
            DeleteChange.append(TithesRemove);
            TithesMembercontainer.append(DeleteChange);
            TithesReport.append(TithesMembercontainer);

            // TithesReport.append(
            //     `<button class="btn btn-Delete" data-delmember="${member.ID}">Remove</button>`
            // );
        }

        
    });

    const TithesList = document.getElementById('financialsFormList');

    if (!hasTithes) {
        TithesList.classList.add('Hide');
        document.querySelector('.two-col').style.gap = '0';
    } else {
        TithesList.classList.remove('Hide');
        document.querySelector('.two-col').style.gap = '20px';
    }
}

function loadRentReport(memberlist) {
    const RentReport = document.getElementById('mFinancials-Report-Rent');
    let hasRent = false;
    memberlist.forEach(member => {
        const Amount = member.Amount == null ? 0 : member.Amount.replaceAll(',', '');

            hasRent = true;
            const RentMembercontainer = document.createElement('div');

            RentMembercontainer.classList.add('flex');
            RentMembercontainer.classList.add('member-Rent');

            const RentMember = document.createElement('input');
            RentMember.value = member.Member
            RentMember.classList.add('financials-report-members');
            RentMember.disabled = true;

            const RentAmount = document.createElement('input');
            RentAmount.value = member.Amount;
            RentAmount.classList.add('financials-report-amount');

            const DeleteChange = document.createElement('div');
            DeleteChange.classList.add('btn-delete-change');

            const RentRemove = document.createElement('button');
            RentRemove.classList.add('btn');
            RentRemove.classList.add('btn-Delete');
            RentRemove.id = 'rent'+member.ID;
            // RentRemove.textContent = "Remove";

            const RentChange = document.createElement('button');
            RentChange.classList.add('btn');
            RentChange.classList.add('btn-Save');
            RentChange.id = 'rent' +member.ID;

            // RentChange.textContent = "Change";

            RentMembercontainer.append(RentMember);
            RentMembercontainer.append(RentAmount);
            DeleteChange.append(RentChange);
            DeleteChange.append(RentRemove);
            RentMembercontainer.append(DeleteChange);
            RentReport.append(RentMembercontainer);

            // RentReport.append(
            //     `<button class="btn btn-Delete" data-delmember="${member.ID}">Remove</button>`
            // );


    });

    const RentList = document.getElementById('financialsFormListRent');

    if (!hasRent) {
        RentList.classList.add('Hide');
        document.querySelector('.two-col-rent').style.gap = '0';

    } else {
        RentList.classList.remove('Hide');
        document.querySelector('.two-col-rent').style.gap = '20px';
    }
}


$(document).on('change', '#reportMonth', function () {
    loadFinancials();
    

});

$(document).on('click', '.btn-Delete', async function () {
    const memberId = this.id;

    await deleteTithes(memberId);

    $(this).closest('.member-tithes').remove();
});



async function deleteTithes(id) {
    const date = $('#reportMonth').val();

    const response = await fetch('/Home/DeleteTithes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: parseInt(id),
            date: date
        })
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error('Delete failed.');
    }
}

// $(document).on('change', '.financials-report-amount', function () {
//     $('.member-tithes').remove();
// });

$(document).on('click', '.btn-Save', async function () {
    const button = $(this);
    const row = button.closest('.member-tithes');

    const memberId = button.attr('id');
    const amountInput = row.find('.financials-report-amount');

    // If currently disabled, enable it for editing
    if (amountInput.prop('disabled')) {
        amountInput.prop('disabled', false);
        amountInput.focus();

        return;
    }

    // Get the changed amount
    const amount = amountInput.val();
    const date = $('#reportMonth').val();

    try {
        const response = await fetch('/Home/UpdateTithes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: parseInt(memberId),
                date: date,
                amount: parseFloat(amount.replaceAll(',',''))
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update tithes.');
        }

        const result = await response.json();

        if (result.success) {
            amountInput.prop('disabled', true);
        }

    } catch (error) {
        console.error(error);
    }
});
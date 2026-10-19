document.addEventListener('DOMContentLoaded', function () {
    loadMinistry();
});

async function loadMinistry() {
    const today = new Date().toISOString().split('T')[0];
    const reportMonth = $('#reportMonth').val() == "" ? today : $('#reportMonth').val();

    const response = await fetch(
        `/Home/GetMinistry?reportMonth=${encodeURIComponent(reportMonth)}`
    );

    if (!response.ok) {
        console.error('Failed to get members');
        return;
    }

    const ministry = await response.json();

    const ministrylist = ministry[0];
    const memberlist = ministry[1];

    const selectMinistry = document.getElementById('mMinistry');

    // Clear previous rows
    selectMinistry.innerHTML = '';

    ministrylist.forEach((m, index) => {

        // =========================
        // Ministry Row
        // =========================

        const ministryRow = document.createElement('div');
        ministryRow.classList.add('ministry-row');


        // =========================
        // Ministry Label
        // =========================

        const ministryName = document.createElement('div');

        ministryName.classList.add('font-label-row');
        ministryName.textContent = m.MinistryRoles + " :";

        // This is the ID used for filtering
        ministryName.dataset.id = m.ID;


        // =========================
        // Search Member Input
        // =========================
        const searchMembers = document.createElement('div');
        searchMembers.classList.add('search-input');

        const personInput = document.createElement('input');

        personInput.type = 'text';
        personInput.classList.add('m' + m.ID);
        personInput.classList.add('Search');
        personInput.placeholder = 'Search Members';
        personInput.autocomplete = 'off';

        personInput.value = m.Member || '';


        // =========================
        // Member Results
        // =========================

        const memberResults = document.createElement('div');

        memberResults.classList.add('member-results');
        memberResults.style.display = 'none';


        // =========================
        // Hidden Member ID
        // =========================

        const memberIdInput = document.createElement('input');

        memberIdInput.type = 'hidden';
        memberIdInput.name = `Ministries[${index}].MemberId`;
        memberIdInput.classList.add('member-id');

        // Existing member
        if (m.Member_ID) {
            memberIdInput.value = m.Member_ID;
        }


        // =========================
        // Hidden Ministry ID
        // =========================

        const ministryIdInput = document.createElement('input');

        ministryIdInput.type = 'hidden';
        ministryIdInput.name = `Ministries[${index}].MinistryId`;
        ministryIdInput.value = m.ID;


        // =========================
        // Ministry Role ID
        // =========================

        const ministryRoleId = m.ID;


        // =========================
        // Create Member Option
        // =========================

        function createMemberOption(member) {

            const memberOption = document.createElement('div');

            memberOption.textContent = member.Member;
            memberOption.dataset.id = member.ID;
            memberOption.classList.add('members-tooltip');

            memberOption.addEventListener('click', (event) => {

                event.stopPropagation();

                personInput.value = member.Member;
                memberIdInput.value = member.ID;

                memberResults.style.display = 'none';

                console.log(
                    'Ministry Role ID:', ministryRoleId,
                    'Ministry ID:', ministryIdInput.value,
                    'Member ID:', member.ID
                );
            });

            return memberOption;
        }


        // =========================
        // Show Members on Click
        // =========================

        personInput.addEventListener('click', (event) => {

            event.stopPropagation();

            // Close all other member-results
            document.querySelectorAll('.member-results').forEach(results => {
                if (results !== memberResults) {
                    results.style.display = 'none';
                }
            });

            memberResults.innerHTML = '';

            // Filter members for THIS ministry role
            const filteredMembers = memberlist.filter(member =>
                String(member.Ministry_Role_ID) === String(ministryRoleId)
            );

            filteredMembers.forEach(member => {
                memberResults.appendChild(
                    createMemberOption(member)
                );
            });

            memberResults.style.display = 'block';
        });


        // =========================
        // Search Members While Typing
        // =========================

        personInput.addEventListener('input', () => {

            // User changed the selected member
            memberIdInput.value = '';

            const searchText = personInput.value
                .toLowerCase()
                .trim();

            const filteredMembers = memberlist.filter(member =>

                // MUST belong to this ministry role
                String(member.Ministry_Role_ID) === String(ministryRoleId)

                &&

                // MUST match search
                member.Member
                    .toLowerCase()
                    .includes(searchText)
            );

            memberResults.innerHTML = '';

            filteredMembers.forEach(member => {
                memberResults.appendChild(
                    createMemberOption(member)
                );
            });

            memberResults.style.display = 'block';
        });


        // =========================
        // Hide Results When Clicking Outside
        // =========================

        document.addEventListener('click', (event) => {

            if (
                event.target !== personInput &&
                !memberResults.contains(event.target)
            ) {
                memberResults.style.display = 'none';
            }

        });


        // =========================
        // Add Elements
        // =========================

        ministryRow.appendChild(ministryName);
        searchMembers.appendChild(personInput);
        searchMembers.appendChild(memberResults);
        ministryRow.appendChild(searchMembers);
        ministryRow.appendChild(memberIdInput);
        ministryRow.appendChild(ministryIdInput);

        selectMinistry.appendChild(ministryRow);

    });
}



$(document).on('change', '#reportMonth', function () {
    $('.ministry-row').remove();
    loadMinistry();
});


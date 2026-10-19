document.addEventListener('DOMContentLoaded', function () {
    loadMinistry();
});

async function loadMinistry() {
    const reportMonth = $('#reportMonth').val();

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
    const selectMember = document.getElementById('mPersonDatalist');
    const memberResults = document.getElementById('memberResults');
    // const personInput = document.getElementById('mPerson');
    const memberIdInput = document.getElementById('mMemberId');

    // ministrylist.forEach(m => {
    //     const ministryoption = document.createElement('div');
    //     ministryoption.value = m.ID;
    //     ministryoption.textContent = m.Ministry;

    //     selectMinistry.append(ministryoption);
    // });
    ministrylist.forEach((m, index) => {

        const ministryRow = document.createElement('div');
        ministryRow.classList.add('ministry-row');

        // Ministry name
        const ministryName = document.createElement('div');
        ministryName.classList.add('font-label-row');
        ministryName.textContent = m.Ministry + " :";
        ministryName.dataset.id = m.ID;

        // Search Members input
        const personInput = document.createElement('input');
        personInput.type = 'text';
        personInput.classList.add('m' + m.ID);
        personInput.placeholder = 'Search Members';
        personInput.autocomplete = 'off';
        personInput.value = m.Member;

        // Member results for THIS ministry
        const memberResults = document.createElement('div');
        memberResults.classList.add('member-results');

        // Hidden member ID
        const memberIdInput = document.createElement('input');
        memberIdInput.type = 'hidden';
        memberIdInput.name = `Ministries[${index}].MemberId`;
        memberIdInput.classList.add('member-id');

        // Hidden ministry ID
        const ministryIdInput = document.createElement('input');
        ministryIdInput.type = 'hidden';
        ministryIdInput.name = `Ministries[${index}].MinistryId`;
        ministryIdInput.value = m.ID;

        memberResults.style.display = 'none';

        // Show members when input is clicked
        personInput.addEventListener('click', () => {

            memberResults.style.display = 'block';
            memberResults.innerHTML = '';

            memberlist.forEach(member => {

                const memberOption = document.createElement('div');

                memberOption.textContent = member.Member;
                memberOption.dataset.id = member.ID;
                memberOption.classList.add('members-tooltip');

                memberOption.addEventListener('click', () => {

                    personInput.value = member.Member;
                    memberIdInput.value = member.ID;

                    memberResults.style.display = 'none';

                    console.log(
                        'Ministry ID:', ministryIdInput.value,
                        'Member ID:', memberIdInput.value
                    );
                });

                memberResults.append(memberOption);
            });
        });

        // Search members while typing
        personInput.addEventListener('input', () => {

            // Clear selected ID if user changes the text
            memberIdInput.value = '';

            const searchText = personInput.value.toLowerCase();

            const filteredMembers = memberlist.filter(member =>
                member.Member.toLowerCase().includes(searchText)
            );

            memberResults.innerHTML = '';

            memberResults.style.display = 'block';

            filteredMembers.forEach(member => {

                const memberOption = document.createElement('div');

                memberOption.textContent = member.Member;
                memberOption.dataset.id = member.ID;
                memberOption.classList.add('members-tooltip');

                memberOption.addEventListener('click', () => {

                    personInput.value = member.Member;
                    memberIdInput.value = member.ID;

                    memberResults.style.display = 'none';

                    console.log(
                        'Ministry ID:', ministryIdInput.value,
                        'Member ID:', memberIdInput.value
                    );
                });

                memberResults.append(memberOption);
            });
        });

        // Hide results when clicking outside
        document.addEventListener('click', (event) => {

            if (
                event.target !== personInput &&
                !memberResults.contains(event.target)
            ) {
                memberResults.style.display = 'none';
            }

        });

        // Add elements
        ministryRow.append(ministryName);
        ministryRow.append(personInput);
        ministryRow.append(memberResults);
        ministryRow.append(memberIdInput);
        ministryRow.append(ministryIdInput);

        selectMinistry.append(ministryRow);
    });

    // memberlist.forEach(m => {
    // // const memberoption = document.createElement('option');
    //     const memberoption = document.createElement('div');
    //     memberoption.value = m.Member;
    //     memberoption.dataset.id = m.ID;

    //     memberResults.append(memberoption);
    // });

    // Hide results initially
    // memberResults.style.display = 'none';

    // Show members when input is clicked
    // personInput.addEventListener('click', () => {
    //     memberResults.style.display = 'block';

    //     memberResults.innerHTML = '';
    //     memberlist.forEach(m => {
    //         const memberOption = document.createElement('div');

    //         memberOption.textContent = m.Member;
    //         memberOption.dataset.id = m.ID;

    //         memberOption.addEventListener('click', () => {
    //             personInput.value = m.Member;
    //             memberIdInput.value = memberOption.dataset.id;

    //             console.log('Selected Member ID:', memberIdInput.value);
    //         });

    //         memberResults.append(memberOption);
    //     });
    // });
   

}




$(document).on('change', '#reportMonth', function () {
    $('.ministry-row').remove();
    loadMinistry();
});


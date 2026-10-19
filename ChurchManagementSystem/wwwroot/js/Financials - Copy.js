document.addEventListener('DOMContentLoaded', function () {
    loadFinancials();
});

async function loadFinancials() {
    const reportMonth = $('#reportMonth').val();

    const response = await fetch(
        `/Home/GetTithes?reportMonth=${encodeURIComponent(reportMonth)}`
    );

    if (!response.ok) {
        console.error('Failed to get members');
        return;
    }

    const Financials = await response.json();
    const TithesList = Financials[0];
    const OfferingAmount = Financials[1];

    const selectFinancials = document.getElementById('mFinancials');
    const memberIdInput = document.getElementById('mMemberId');

    TithesList.forEach((m, index) => {

        const FinancialsRow = document.createElement('div');
        FinancialsRow.classList.add('Financials-row');

        // Member name
        const members = document.createElement('div');
        members.classList.add('font-label-plain');
        members.textContent = m.Member + " :";
        members.dataset.id = m.ID;

        // Hidden member ID
        const memberIdInput = document.createElement('input');
        memberIdInput.type = 'hidden';
        memberIdInput.name = `Tithes[${index}].MemberId`;
        memberIdInput.value = m.ID;


        // Search Members input
        const tithes = document.createElement('input');
        tithes.type = 'text';
        tithes.value = m.Amount;
        tithes.classList.add('tithes-amount');

        // Add elements
        FinancialsRow.append(members);
        FinancialsRow.append(tithes);
        FinancialsRow.append(memberIdInput);

        selectFinancials.append(FinancialsRow);
    });

}




$(document).on('change', '#reportMonth', function () {
    $('.Financials-row').remove();
    loadFinancials();
});


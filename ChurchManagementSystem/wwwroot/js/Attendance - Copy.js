document.addEventListener('DOMContentLoaded', async function () {
    //get members

    const response = await fetch('/Home/GetMembers');

    if (!response.ok) {
        console.error('Failed to get members');
        return;
    }

    const members = await response.json();

    console.log(members);

    GetMembers(members);

    // attendance
    const grid = document.getElementById('grid');
    const template = document.getElementById('avatar-template');

    function renderAvatars(count) {
        grid.innerHTML = '';

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            fragment.appendChild(template.content.cloneNode(true));
        }

        grid.appendChild(fragment);
    }

    renderAvatars(members.length);

});


function GetMembers(members) {

    const form = document.querySelector(
        '.attendance-edit-row[data-editform="1"]'
    );

    if (!form) {
        console.error('Member edit form not found');
        return;
    }

    members.forEach(m => {
        var present = m.Present ? 'present' : 'absent';


        const name = m.LastName
            ? m.LastName + ', ' + m.FirstName
            : m.FirstName;

        form.insertAdjacentHTML(
            'afterend',
            '<button class="chip ' + present + '" data-toggle="'+m.ID+'" data-name="' + (name) + '">' + (name) + '</button>'
        );
    });
}

document.addEventListener("click", function (e) {
    const button = e.target.closest(".chip");

    if (!button) return;

    const memberId = button.dataset.toggle;

    console.log("Member ID:", memberId);

    button.classList.toggle("present");

    if (button.classList.contains("present")) {
        button.textContent = "✓ " + button.dataset.name;
    } else {
        button.textContent = button.dataset.name;
    }
});
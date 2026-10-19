async function loadAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const reportMonth = $('#reportMonth').val() == "" ? today : $('#reportMonth').val() ;


    const response = await fetch(
        `/Home/GetAttendance?reportMonth=${encodeURIComponent(reportMonth)}`
    );

    if (!response.ok) {
        console.error('Failed to get members');
        return;
    }

    const members = await response.json();

    GetMembers(members);
    renderAvatars(members);
}


document.addEventListener('DOMContentLoaded', function () {
    loadAttendance();
});

$(document).on('change', '#reportMonth', function () {
    $('.chip').remove();
    $('#btnSave').remove();
    loadAttendance();
});

// Adjust this to match wherever your member images actually live
const IMAGE_FOLDER = '/Images/';

function renderAvatars(members) {
    const grid = document.getElementById('grid');
    const template = document.getElementById('avatar-template');

    if (!grid || !template) {
        console.error('Avatar grid or template not found');
        return;
    }

    grid.innerHTML = '';

    const fragment = document.createDocumentFragment();
    members.sort((a, b) => {
        if (!a.LastName && !b.LastName) {
            return a.ID - b.ID;
        }

        if (!a.LastName) return 1;
        if (!b.LastName) return -1;

        return a.LastName.localeCompare(b.LastName);
    });
    members.forEach(m => {
        const card = template.content.cloneNode(true);
        const cardEl = card.querySelector('.avatar-card');
        const icon = card.querySelector('.avatar-icon');

        const imageFile = m.FirstName + '.png';
        const name = m.LastName ? m.LastName + ', ' + m.FirstName : m.FirstName;

        if (imageFile) {
            const img = document.createElement('img');
            img.src = imageFile.startsWith('http') || imageFile.startsWith('/')
                ? imageFile
                : IMAGE_FOLDER + m.FirstName + '.png';
            img.alt = name || '';
            img.className = 'avatar-img-' + (m.Present ? 'present' : 'absent');
            img.id = 'avatar-img-' + m.ID;
            img.onerror = () => {
                // fall back to the placeholder icon if the image fails to load
                img.replaceWith(icon);
            };
            icon.replaceWith(img);
        }

        cardEl.dataset.memberId = m.ID;
        if (name) cardEl.title = name;

        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

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

        let name = m.LastName
            ? m.LastName + ', ' + m.FirstName
            : m.FirstName;

        if (m.Present) name = "✓ " + name;

        form.insertAdjacentHTML(
            'afterbegin',
            '<button type="button" id="chip-' + m.ID + '" class="chip ' + present + ' chip-'+ m.ID+'" data-toggle="' + m.ID + '" data-name="' + (name) + '">' + (name) + '</button>'
        );
    });

    // Add button after all members
    // form.insertAdjacentHTML(
    //     'beforeend',
    //     '<button type="submit" class="btn btn-save" id="saveAttendance">Save</button>'
    // );
}

$(document).on('click', '.chip', function () {

    const button = this;

    const memberId = button.dataset.toggle;

        if (!button) return;


        console.log("Member ID:", memberId);


        const avatar = document.getElementById('avatar-img-' + memberId);


    if (button.classList.contains("present")) {
        button.classList.replace("present", "absent");
        button.textContent = button.dataset.name;
        avatar.classList.replace('avatar-img-present', 'avatar-img-absent');
            
    } else {
        button.classList.replace("absent", "present");
        button.textContent = "✓ " + button.dataset.name;
        avatar.classList.replace('avatar-img-absent', 'avatar-img-present');
        }
    
});

$(document).on('click', '#btnAddVisitor', function () {
        var visitorName = $('#visitorName').val();
        const visitorLabel = document.querySelector("#Visitors");

        visitorLabel.insertAdjacentHTML(
            "beforebegin",
            `<button type="button"
                 id="chip-0"
                 class="chip present chip-0"
                 data-toggle="0"
                 data-name="${visitorName}">
            ${visitorName}
        </button>`
        );

    $('#visitorName').val('');
});
$(document).on('click', '#saveAttendance', async function (e) {

    e.preventDefault();

    const form = $('#memberForm-attendance')[0];
    const attendanceDate = $('#reportMonth').val();

    $(form).find('.attendance-input').remove();

    let index = 0;

    $(form).find('.chip.present').each(function () {

        const chip = $(this);

        console.log("FOUND:", chip.attr('id'));

        const chipId = chip.attr('id');
        const memberId = chip.data('toggle');
        const name = chip.data('name');

        $('<input>', {
            type: 'hidden',
            name: `Attendance[${index}].ID`,
            value: memberId,
            class: 'attendance-input'
        }).appendTo(form);

        $('<input>', {
            type: 'hidden',
            name: `Attendance[${index}].Date`,
            value: attendanceDate,
            class: 'attendance-input'
        }).appendTo(form);

        $('<input>', {
            type: 'hidden',
            name: `Attendance[${index}].IsVisitor`,
            value: chipId === 'chip-0' ? 1 : 0,
            class: 'attendance-input'
        }).appendTo(form);

        $('<input>', {
            type: 'hidden',
            name: `Attendance[${index}].Username`,
            value: name,
            class: 'attendance-input'
        }).appendTo(form);

        index++;
    });

    console.log("Attendance count:", index);
    const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form)
    });

    const result = await response.text();

    console.log(result);
});

// const memberSearch = document.getElementById("memberSearch");

// memberSearch.addEventListener("input", function () {
$(document).on('input', '#memberSearch', function () {
    const memberChips = document.querySelectorAll(".chip");
    const searchValue = this.value.toLowerCase().trim();

    memberChips.forEach(chip => {

        const memberName = chip.dataset.name.toLowerCase();

        if (memberName.includes(searchValue)) {
            chip.style.display = "";
        } else {
            chip.style.display = "none";
        }

    });

});
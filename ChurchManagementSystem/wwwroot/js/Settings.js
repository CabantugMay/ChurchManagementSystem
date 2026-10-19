let membersDB = [];
let ministryAssign = [];
let ministryDes = [];
document.addEventListener('DOMContentLoaded', async function () {
    try {
        await reload();
    } catch (e) { }

    try {

    }
    catch (e) { }

    Prompt();
});


async function reload() {
    const response = await fetch('/Home/GetSettings');

    if (!response.ok) {
        console.error('Failed to get members');
        return;
    }

    const responses = await response.json();
    members = responses[0];

    membersDB = members;
    ministryDes = responses[1];

    GetMembers(members);
    GetMinistry(responses[1]);

    ministryAssign = responses[2];
}

function GetMembers(members) {

    const form = document.querySelector(
        '.member-add-row[data-editform="1"]'
    );

    if (!form) {
        console.error('Member edit form not found');
        return;
    }

    document.querySelectorAll('.member-row').forEach(row => row.remove());

    members.forEach(m => {

        const name = m.LastName
            ? m.LastName + ', ' + m.FirstName
            : m.FirstName;

        form.insertAdjacentHTML(
            'beforeend',
            '<div class="member-row"><div class="member-name">' +
            '<span>' + (name) + '</span></div>' +
            '<div class="modify-members">' +
            '<button id="btnUpdateMember" class="btn btn-Update" data-editmember="' + m.ID +
            '" >' +
            '</button>' +
            '<button id="btnDeleteMember" class="btn btn-Delete" data-delmember="' + m.ID + '">' +
            '</button>' +
            '</div>' +
            '</div>'
        );
    });
}

function isComplete(e) {
    var form = document.getElementById("memberFormUpdate");
    var fields = form.querySelectorAll(".required");
    var firstInvalid = null;

    for (var i = 0; i < fields.length; i++) {

        var field = fields[i];

        if (field.value.trim() === "") {

            field.classList.add("required-error");

            if (firstInvalid === null) {
                firstInvalid = field;
            }

        } else {

            field.classList.remove("required-error");

        }
    }

    if (firstInvalid !== null) {

        e.preventDefault();

        firstInvalid.focus();

        firstInvalid.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return false;
    }

    return true;
}

function Prompt() {
    var popup = document.getElementById("successPopup");

    if (!popup) {
        return;
    }

    var closeButton = document.getElementById("successPopupClose");

    closeButton.onclick = function () {
        popup.remove();
    };

    setTimeout(function () {
        popup.remove();
    }, 3000);
}

$(document).on("click", "#btnUpdateMember", function () {
    const id = $(this).data("editmember");

    const member = membersDB.find(m => m.ID == id);

    if (!member) return;

    $("#ID").val(member.ID);
    $("#firstName").val(member.FirstName);
    $("#middleName").val(member.MiddleName);
    $("#lastName").val(member.LastName);
    $("#username").val(member.Username);
    $("#gender").val(member.Gender);
    $("#address").val(member.Addr);
    $("#birthday").val(member.BirthDate?.substring(0, 10));
    $("#address").val(member.Addr);
    $("#contact").val(member.PhoneNumber);
    $("#email").val(member.Email);
});

function GetMinistry(data) {

    const container = $('#ministry-container');
    container.empty();

    // Group by Ministry_ID
    const ministries = {};

    data.forEach(item => {

        if (!ministries[item.Ministry_ID]) {
            ministries[item.Ministry_ID] = {
                Ministry_ID: item.Ministry_ID,
                Ministry: item.Ministry,
                Roles: []
            };
        }

        // Only add roles that exist
        if (item.Roles_ID != null && item.MinistryRoles != null) {

            ministries[item.Ministry_ID].Roles.push({
                ID: item.Roles_ID,
                Name: item.MinistryRoles
            });

        }
    });

    // Create ministry sections
    Object.values(ministries).forEach(ministry => {

        const ministryItem = $('<div>', {
            class: 'ministry-item'
        });

        // -------------------------
        // MINISTRY HEADER
        // -------------------------

        const ministryHeader = $('<div>', {
            class: 'ministry-header'
        });

        ministryHeader.append(
            $('<span>', {
                class: 'ministry-name',
                text: ministry.Ministry
            })
        );

        // Only show dropdown button if roles exist
        if (ministry.Roles.length > 0) {

            const toggle = $('<button>', {
                type: 'button',
                class: 'ministry-toggle',
                html: '<ion-icon name="chevron-down-outline"></ion-icon>'
            });

            ministryHeader.append(toggle);

        }

        ministryItem.append(ministryHeader);


        // -------------------------
        // ROLES
        // -------------------------

        if (ministry.Roles.length > 0) {

            const rolesContainer = $('<div>', {
                class: 'ministry-roles'
            });

            ministry.Roles.forEach(role => {

                rolesContainer.append(
                    $('<div>', {
                        class: 'ministry-role',
                        'data-role-id': role.ID,
                        text: role.Name
                    })
                );

            });

            // Add Role form
            const addRolesContainer = $('<form>', {
                action: '/Home/AddMinistryRole',
                method: 'post',
                class: 'add-role-form'
            });

            const roleInput = $('<input>', {
                type: 'text',
                name: 'nMinistryRole',
                class: 'margin-10',
                placeholder: 'New Role'
            });

            const ministryInput = $('<input>', {
                type: 'hidden',
                name: 'Ministry_ID',
                value: ministry.Ministry_ID
            });

            const addRoleButton = $('<button>', {
                type: 'submit',
                class: 'btn btn-default',
                text: 'Add'
            });

            addRolesContainer.append(
                roleInput,
                ministryInput,
                addRoleButton
            );

            rolesContainer.append(addRolesContainer);
            ministryItem.append(rolesContainer);

            
        }

        container.append(ministryItem);
    });


    // -------------------------
    // TOGGLE ROLES
    // -------------------------

    $(document)
        .off('click', '.ministry-toggle')
        .on('click', '.ministry-toggle', function () {

            const button = $(this);
            const roles = button.closest('.ministry-item').find('.ministry-roles');

            roles.slideToggle(200);

            button.toggleClass('open');

        });
}

$(document).on('click', '.ministry-role', function () {
    document.querySelectorAll('#ministryDesContainer div').forEach(div => div.remove());
    document.querySelectorAll('#ministryDesContainer form').forEach(div => div.remove());

    const selectedRole = event.target.closest('.ministry-role');
    if (!selectedRole) return; // Exit if click wasn't on a role element

    // Remove .active from all, then add to clicked element
    document.querySelectorAll('.ministry-role').forEach(role => role.classList.remove('active'));
    selectedRole.classList.add('active');

    const container = document.querySelector('#ministryDesContainer');
    const role_id = $(this).data('role-id');
    const ministry_wdy = ministryDes.find(n => n.Roles_ID == role_id);
    let membersAssign = ministryAssign.filter(n => n.Ministry_Role_ID == role_id);

    

    container.insertAdjacentHTML('beforeend', `
    <div class="ministry-row"> 
        <div class="ministryAssign-header" data-editministry="` + ministry_wdy.Roles_ID + `"><span>${ministry_wdy.MinistryRoles}</span></div>` +
        `</div>
        `);


    if (membersAssign[0] != undefined) {
        let ministry_ID = membersAssign[0].Ministry_Role_ID;
        const roleName = $(this)
            .contents()
            .filter(function () {
                return this.nodeType === 3;
            })
            .text()
            .trim();

        container.insertAdjacentHTML('beforeend', `
        <form id="memberMinistryForm" class="ministry-row-add-assign" action="/Home/AddMinistryAssign" method="post">
        <select id="memberSelect" name="member_ID" class="member-select">
            <option value="">Select Member</option>
            ${membersDB
                .filter(member =>
                    !membersAssign.some(assigned => assigned.Members_ID === member.ID)
                )
                .map(member => {
                    const name = member.LastName
                        ? `${member.LastName}, ${member.FirstName || ''}`
                        : (member.FirstName || '');

                    return `<option value="${member.ID}">${name}</option>`;
                }).join('')}
        </select>
         <input type="hidden" id="roleId" name="roleId" value="${ministry_wdy.Roles_ID}">
        <button type="submit"  id="btnAddASsignMinistry" class="btn btn-default">
            <ion-icon name="person-add-outline"></ion-icon>
            Add
        </button>
    </form>

`);


        membersAssign.forEach(member => {
            container.insertAdjacentHTML('beforeend', `
        <div class="ministry-header-row">
        <div class="member-row-assign" data-member-id="${member.Members_ID}">${member.Member}</div>` +
        `<button type="button" class="remove-member">×</button></div>
        `);

        })

        


    }
    else {

        container.insertAdjacentHTML('beforeend', `
         <form id="memberMinistryForm" class="ministry-row-add-assign" action="/Home/AddMinistryAssign" method="post">
        <select id="memberSelect" name="member_ID" class="member-select">
            <option value="">Select Member</option>
            ${membersDB
                .map(member => {
                    const name = member.LastName
                        ? `${member.LastName}, ${member.FirstName || ''}`
                        : (member.FirstName || '');

                    return `<option value="${member.ID}">${name}</option>`;
                }).join('')}
        </select>

        <input type="hidden" name="roleId" value="${ministry_wdy.Roles_ID}">
        <button type="submit"  id="btnAddASsignMinistry" class="btn btn-default">
            <ion-icon name="person-add-outline"></ion-icon>
            Add
        </button>
    </form>
`);

        container.insertAdjacentHTML('beforeend', `
        <div class="no-data">No Data Available</div>
        `);
    }

    container.insertAdjacentHTML('beforeend', `
    <div class="ministry-footer">
        <div class="schedule-options">
            <label>
                <input type="radio" name="schedule" value="weekly"
                    ${ministry_wdy.isWeekly ? 'checked' : ''}>
                Weekly
            </label>

            <label>
                <input type="radio" name="schedule" value="monthly"
                    ${ministry_wdy.isMonthly ? 'checked' : ''}>
                Monthly
            </label>

            <label>
                <input type="radio" name="schedule" value="yearly"
                    ${ministry_wdy.isYearly ? 'checked' : ''}>
                Yearly
            </label>
        </div>

        <div class="ministry-row-save">
            <button type="button" id="btnSaveMinistryAssign" class="btn btn-default">
                <ion-icon name="save-outline"></ion-icon>
                Save
            </button>
        </div>
    </div>
`);

});

document.addEventListener("contextmenu", function (e) {

    const role = e.target.closest(".ministry-role");

    // Not a ministry role
    if (!role) {
        return;
    }

    // Prevent browser's normal right-click menu
    e.preventDefault();

    // Remove existing popup
    document.querySelectorAll(".role-popup").forEach(popup => {
        popup.remove();
    });

    const roleId = role.dataset.roleId;
    const roleName = role.textContent.trim();

    // Create popup
    const popup = document.createElement("div");
    popup.className = "role-popup show";

    popup.innerHTML = `
        <button type="button" class="edit-role">
            Edit
        </button>

        <button type="button" class="remove-role">
            Remove
        </button>
    `;

    role.appendChild(popup);

    // Edit
    popup.querySelector(".edit-role").addEventListener("click", function (e) {
        e.stopPropagation();

        console.log("Edit:", roleId, roleName);
    });

    // Remove
    popup.querySelector(".remove-role").addEventListener("click", function (e) {
        e.stopPropagation();

        console.log("Remove:", roleId, roleName);
    });
});

$(document).off('click', '.remove-member').on('click', '.remove-member', function () {

    const container = $(this).closest('.ministry-header-row');
    const memberRow = container.find('.member-row-assign');
    const memberId = memberRow.attr('data-member-id');
    // const memberId = row.data('member-id');
    const roleId = $('#roleId').val();


    $.ajax({
        url: '/Home/DeleteMinistryAssign',
        type: 'POST',
        data: {
            memberId: memberId,
            roleId: roleId
        },
        success: async function (response) {

            if (response.success) {
                container.remove();
                window.location.href = '/Home/Settings#ministry-section';
                await reload();
            }

        },
        error: function () {
            alert('Failed to remove member.');
        }
    });

});


document.addEventListener('submit', async function (e) {
    if (!e.target.matches('#memberMinistryForm')) return;

    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const memberID = formData.get('member_ID');
    const memberName = document.querySelector('#memberSelect')
        .selectedOptions[0].text;

  
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('Saved successfully');

            // Refresh your data or update the UI here.
            await reload();
            SavedMemberAssign(memberID, memberName);
            window.location.href = '/Home/Settings#ministry-section';
        } else {
            console.error(result.message || 'Failed to save.');
        }
    } catch (error) {
        console.error('Submission error:', error);
    }
});


function SavedMemberAssign(memberID, memberName) {
    const container = document.querySelector('.ministry-footer');
    container.insertAdjacentHTML('beforebegin', `
        <div class="ministry-header-row">
        <div class="member-row-assign" data-member-id="${memberID}">${memberName}</div>` +
        `<button type="button" class="remove-member">×</button></div>
        `);

    document.querySelector('.no-data')?.remove();
}
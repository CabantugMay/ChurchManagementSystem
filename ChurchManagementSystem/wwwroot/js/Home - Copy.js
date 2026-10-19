
// $(document).on('click', '#toggleManage', function () {
//     // your code here
//     if ($('.manage-box').is(':hidden')) {
//         $('.manage-box').show();
//     } else {
//         $('.manage-box').hide();
//     }
   
// });

// $(document).ready(function () {
//     $('.manage-box').hide();
// });

(function () {
    $('.manage-box').hide();
    var STORAGE_KEY = 'church_data_v2';
    var CATEGORIES = [
        { id: 'adult', label: 'Adults' },
        { id: 'youth', label: 'Youth' },
        { id: 'child', label: 'Children' }
    ];
    var ROLES = [
        { id: 'admin', label: 'Admin' },
        { id: 'treasurer', label: 'Treasurer' },
        { id: 'pastor', label: 'Pastor' },
        { id: 'secretary', label: 'Secretary' }
    ];
    var TABS = [
        { id: 'dashboard', label: 'Summary', roles: ['admin', 'treasurer', 'pastor', 'secretary'] },
        { id: 'attendance', label: 'Attendance', roles: ['admin', 'secretary'] },
        { id: 'ministry', label: 'Ministry schedule', roles: ['admin', 'pastor', 'secretary'] },
        { id: 'giving', label: 'Tithes', roles: ['admin', 'treasurer'] },
        { id: 'offering', label: 'Offering', roles: ['admin', 'treasurer'] },
        { id: 'rental', label: 'Rental Pledge', roles: ['admin', 'treasurer'] }
    ];

    var DEFAULT_CHURCH_NAME = 'Almighty God Covenant Church - Mariveles';
    var DEFAULT_ALLOCATION = [
        { id: 'tithesOfTithes', title: 'Tithes of the tithes', percent: 10, deducts: true },
        { id: 'churchOperation', title: 'Church Operation', percent: 10, deducts: true },
        { id: 'familyWelfare', title: 'Family Welfare', percent: 50, deducts: false },
        { id: 'localMission', title: 'Local Mission', percent: 25, deducts: false },
        { id: 'pastorAllowance', title: 'Pastor Allowance', percent: 25, deducts: false }
    ];

    function normalizeAllocation(raw) {
        var sharedBaseIds = { familyWelfare: true, localMission: true, pastorAllowance: true };
        if (Array.isArray(raw) && raw.length) {
            return raw.map(function (item) {
                var id = item.id || uid();
                var deducts = item.deducts !== undefined ? !!item.deducts : !sharedBaseIds[id];
                return { id: id, title: item.title || '', percent: Number(item.percent) || 0, deducts: deducts };
            });
        }
        if (raw && typeof raw === 'object') {
            var oldKeyTitles = {
                tithesOfTithes: 'Tithes of the tithes',
                churchOperation: 'Church Operation',
                familyWelfare: 'Family Welfare',
                localMission: 'Local Mission',
                pastorAllowance: 'Pastor Allowance'
            };
            var converted = Object.keys(oldKeyTitles)
                .filter(function (k) { return raw[k] !== undefined; })
                .map(function (k) { return { id: k, title: oldKeyTitles[k], percent: Number(raw[k]) || 0, deducts: !sharedBaseIds[k] }; });
            if (converted.length) return converted;
        }
        return DEFAULT_ALLOCATION.map(function (item) { return Object.assign({}, item); });
    }
    var DEFAULT_MINISTRY_TYPES = ['Teacher', 'Song Lead', 'Guitarist', 'Food'];

    var state = {
        role: 'admin',
        tab: 'dashboard',
        selectedDate: mostRecentSunday(),
        data: loadData(),
        givingFormDate: null,
        ministryFormDate: null,
        offeringFormDate: null,
        rentalFormDate: null,
        showManageMembers: false,
        editingMemberId: null,
        reportMonth: null,
        attendanceSearch: '',
        showAllocationSettings: false,
        showManageMinistries: false
    };
    state.givingFormDate = state.selectedDate;
    state.ministryFormDate = state.selectedDate;
    state.offeringFormDate = state.selectedDate;
    state.rentalFormDate = state.selectedDate;
    state.reportMonth = state.selectedDate.slice(0, 7);

    var charts = {};

    function uid() { return Math.random().toString(36).slice(2, 10); }

    function toLocalDateStr(d) {
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function memberOptionsHtml(placeholder) {
        if (state.data.members.length === 0) {
            return '<option value="">No members yet — add them in Attendance</option>';
        }
        var opts = state.data.members.map(function (m) { return '<option value="' + esc(m.name) + '">' + esc(m.name) + '</option>'; }).join('');
        return (placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '') + opts;
    }
    function memberDatalistHtml(id) {
        var opts = state.data.members.map(function (m) { return '<option value="' + esc(m.name) + '"></option>'; }).join('');
        return '<datalist id="' + id + '">' + opts + '</datalist>';
    }
    function memberSearchPlaceholder() {
        return state.data.members.length === 0 ? 'No members yet — add them in Attendance' : 'Search or select a member';
    }

    function mostRecentSunday() {
        var d = new Date();
        d.setDate(d.getDate() - d.getDay());
        return toLocalDateStr(d);
    }

    function formatLong(dateStr) {
        var d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    function formatShort(dateStr) {
        var d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    function sundaysInMonth(monthStr) {
        var parts = monthStr.split('-');
        var year = Number(parts[0]), month = Number(parts[1]);
        var d = new Date(year, month - 1, 1);
        while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
        var sundays = [];
        while (d.getMonth() === month - 1) {
            sundays.push(toLocalDateStr(d));
            d.setDate(d.getDate() + 7);
        }
        return sundays;
    }
    function monthLabel(monthStr) {
        var parts = monthStr.split('-');
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    function currency(n) {
        return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function esc(s) {
        var div = document.createElement('div');
        div.textContent = s == null ? '' : String(s);
        return div.innerHTML;
    }

    function loadData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (!parsed.members) parsed.members = [];
                if (!parsed.offering) parsed.offering = [];
                if (!parsed.offeringExpenses) parsed.offeringExpenses = [];
                if (!parsed.rental) parsed.rental = [];
                if (!parsed.rentalExpenses) parsed.rentalExpenses = [];
                if (!parsed.churchName) parsed.churchName = DEFAULT_CHURCH_NAME;
                if (!parsed.ministryTypes) parsed.ministryTypes = DEFAULT_MINISTRY_TYPES.slice();
                parsed.allocationSettings = normalizeAllocation(parsed.allocationSettings);
                return parsed;
            }
        } catch (e) { }
        return { giving: [], attendance: [], ministry: [], members: [], offering: [], offeringExpenses: [], rental: [], rentalExpenses: [], churchName: DEFAULT_CHURCH_NAME, ministryTypes: DEFAULT_MINISTRY_TYPES.slice(), allocationSettings: DEFAULT_ALLOCATION.map(function (item) { return Object.assign({}, item); }) };
    }

    var saveError = false;
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
            saveError = false;
        } catch (e) {
            saveError = true;
        }
        renderErrorBanner();
    }

    function renderErrorBanner() {
        var el = document.getElementById('errorBanner');
        el.innerHTML = saveError
            ? '<div class="error-banner">Couldn\'t save your last change. Your browser storage may be full or disabled.</div>'
            : '';
    }

    // ---------- top controls ----------
    function renderChurchName() {
        // var input = document.getElementById('churchNameInput');
        // input.value = state.data.churchName || DEFAULT_CHURCH_NAME;
        // document.title = input.value;
        // input.onchange = function (e) {
        //     var name = e.target.value.trim() || DEFAULT_CHURCH_NAME;
        //     state.data.churchName = name;
        //     document.title = name;
        //     save();
        // };
    }

    function renderTopControls() {
        // renderChurchName();
        // var roleSelect = document.getElementById('roleSelect');
        // roleSelect.innerHTML = ROLES.map(function (r) {
        //     return '<option value="' + r.id + '"' + (r.id === state.role ? ' selected' : '') + '>' + r.font-label + '</option>';
        // }).join('');
        // roleSelect.onchange = function (e) {
        //     state.role = e.target.value;
        //     var visible = visibleTabs();
        //     if (!visible.some(function (t) { return t.id === state.tab; })) {
        //         state.tab = visible[0] ? visible[0].id : 'dashboard';
        //     }
        //     renderTabs();
        //     renderContent();
        // };

        // var dateInput = document.getElementById('selectedDate');
        // dateInput.value = state.selectedDate;
        // dateInput.onchange = function (e) {
        //     state.selectedDate = e.target.value;
        //     state.givingFormDate = state.selectedDate;
        //     state.ministryFormDate = state.selectedDate;
        //     state.offeringFormDate = state.selectedDate;
        //     state.rentalFormDate = state.selectedDate;
        //     renderContent();
        // };

        // document.getElementById('exportBtn').onclick = exportData;
        // var importFile = document.getElementById('importFile');
        // document.getElementById('importBtn').onclick = function () { importFile.click(); };
        // importFile.onchange = function (e) {
        //     var file = e.target.files[0];
        //     if (file) importData(file);
        //     importFile.value = '';
        // };

        // renderTabs();
    }

    function showImportNotice(message, isError) {
        var el = document.getElementById('importNotice');
        if (!message) { el.innerHTML = ''; return; }
        var style = isError ? '' : 'background:var(--sage-light);color:var(--sage)';
        el.innerHTML = '<div class="error-banner" style="' + style + '">' + esc(message) + '</div>';
    }

    function exportData() {
        var blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var stamp = toLocalDateStr(new Date());
        a.href = url;
        a.download = 'church-data-backup-' + stamp + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showImportNotice('Backup file downloaded.', false);
    }

    function importData(file) {
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var parsed = JSON.parse(reader.result);
                var looksValid = parsed && Array.isArray(parsed.giving) && Array.isArray(parsed.attendance) &&
                    Array.isArray(parsed.ministry) && Array.isArray(parsed.members);
                if (!looksValid) {
                    showImportNotice('That file doesn\'t look like a church data backup.', true);
                    return;
                }
                if (!window.confirm('This will replace all current data in this browser with the contents of the backup file. Continue?')) {
                    return;
                }
                if (!parsed.offering) parsed.offering = [];
                if (!parsed.offeringExpenses) parsed.offeringExpenses = [];
                if (!parsed.rental) parsed.rental = [];
                if (!parsed.rentalExpenses) parsed.rentalExpenses = [];
                if (!parsed.churchName) parsed.churchName = DEFAULT_CHURCH_NAME;
                if (!parsed.ministryTypes) parsed.ministryTypes = DEFAULT_MINISTRY_TYPES.slice();
                parsed.allocationSettings = normalizeAllocation(parsed.allocationSettings);
                state.data = parsed;
                save();
                renderContent();
                renderChurchName();
                showImportNotice('Backup restored successfully.', false);
            } catch (e) {
                showImportNotice('Could not read that file — make sure it\'s a valid backup JSON.', true);
            }
        };
        reader.onerror = function () {
            showImportNotice('Could not read that file.', true);
        };
        reader.readAsText(file);
    }

    function visibleTabs() {
        return TABS.filter(function (t) { return t.roles.indexOf(state.role) !== -1; });
    }

    function renderTabs() {
        var row = document.getElementById('tabsRow');
        var visible = visibleTabs();
        row.innerHTML = visible.map(function (t) {
            return '<button class="tab-btn' + (state.tab === t.id ? ' active' : '') + '" data-tab="' + t.id + '">' + t.font-label + '</button>';
        }).join('');
        Array.prototype.forEach.call(row.querySelectorAll('.tab-btn'), function (btn) {
            btn.onclick = function () {
                state.tab = btn.getAttribute('data-tab');
                renderTabs();
                renderContent();
            };
        });
        document.getElementById('dateInputWrap').style.display = state.tab === 'dashboard' ? 'none' : '';
    }

    // ---------- content dispatch ----------
    function renderContent() {
        // var el = document.getElementById('content');
        // if (state.tab === 'dashboard') el.innerHTML = dashboardHtml();
        // else if (state.tab === 'giving') el.innerHTML = givingHtml();
        // else if (state.tab === 'offering') el.innerHTML = offeringHtml();
        // else if (state.tab === 'rental') el.innerHTML = rentalHtml();
        // else if (state.tab === 'attendance') el.innerHTML = attendanceHtml();
        // else if (state.tab === 'ministry') el.innerHTML = ministryHtml();

        // if (state.tab === 'dashboard') attachDashboard();
        // else if (state.tab === 'giving') attachGiving();
        // else if (state.tab === 'offering') attachOffering();
        // else if (state.tab === 'rental') attachRental();
        // else if (state.tab === 'attendance') attachAttendance();
        // else if (state.tab === 'ministry') attachMinistry();
    }

    // ---------- dashboard ----------
    function dashboardHtml() {
        return '' +
            '<div class="report-section">' +
            '<div class="report-header">' +
            '<div class="section-title" style="margin-bottom:0">Monthly report</div>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
            '<input type="month" id="reportMonth" value="' + esc(state.reportMonth) + '" />' +
            '<button class="btn btn-default" id="exportPdfBtn" type="button">Export PDF</button>' +
            '</div>' +
            '</div>' +
            '<div class="card" style="margin-bottom:20px">' + attendeesReportHtml(state.reportMonth) + '</div>' +
            '<div class="card" style="margin-bottom:20px">' + ministryReportHtml(state.reportMonth) + '</div>' +
            '<div class="card">' + tithesReportHtml(state.reportMonth) + '</div>' +
            '</div>';
    }

    function attendeesReportHtml(monthStr) {
        var sundays = sundaysInMonth(monthStr);
        if (sundays.length === 0) return '<div class="muted-note">No Sundays found for this month.</div>';
        var records = {};
        state.data.attendance.forEach(function (a) { records[a.date] = a; });

        var headerCells = sundays.map(function (s, i) {
            return '<th>Week ' + (i + 1) + '<span class="week-sub">' + esc(formatShort(s)) + '</span></th>';
        }).join('');

        var memberRows = state.data.members.length ? state.data.members.map(function (m) {
            var cells = sundays.map(function (s) {
                var rec = records[s];
                var present = rec && (rec.presentIds || []).indexOf(m.id) !== -1;
                return '<td' + (present ? ' class="present-cell"' : '') + '>' + (present ? '✓' : '') + '</td>';
            }).join('');
            return '<tr><td>' + esc(m.name) + '</td>' + cells + '</tr>';
        }).join('') : '';

        var visitorRow = '<tr class="total-row"><td>Visitors</td>' + sundays.map(function (s) {
            var rec = records[s];
            var names = rec ? (rec.visitors || []).map(function (v) { return esc(v.name); }).join(', ') : '';
            return '<td style="white-space:normal">' + names + '</td>';
        }).join('') + '</tr>';

        return '<div class="section-title">Summary of Attendees — ' + esc(monthLabel(monthStr)) + '</div>' +
            '<div class="table-wrap"><table class="report-table"><thead><tr><th>Attendees</th>' + headerCells + '</tr></thead><tbody>' +
            (memberRows || '<tr><td colspan="' + (sundays.length + 1) + '" style="text-align:center;color:var(--muted)">No members added yet.</td></tr>') +
            visitorRow +
            '</tbody></table></div>';
    }

    function ministryReportHtml(monthStr) {
        var sundays = sundaysInMonth(monthStr);
        if (sundays.length === 0) return '<div class="muted-note">No Sundays found for this month.</div>';

        var monthAssignments = state.data.ministry.filter(function (m) { return sundays.indexOf(m.date) !== -1; });

        var presetMinistries = state.data.ministryTypes.slice();
        var ministryNames = presetMinistries.slice();
        monthAssignments.forEach(function (m) {
            if (ministryNames.indexOf(m.ministry) === -1) ministryNames.push(m.ministry);
        });

        var statusColor = { confirmed: 'var(--sage)', pending: 'var(--brass-dark)', declined: 'var(--rust)' };

        var headerCells = sundays.map(function (s, i) {
            return '<th>Week ' + (i + 1) + '<span class="week-sub">' + esc(formatShort(s)) + '</span></th>';
        }).join('');

        var rows = ministryNames.map(function (name) {
            var cells = sundays.map(function (s) {
                var assignments = monthAssignments.filter(function (m) { return m.date === s && m.ministry === name; });
                if (assignments.length === 0) return '<td></td>';
                var names = assignments.map(function (a) {
                    return '<span style="color:' + statusColor[a.status] + '">' + esc(a.person) + '</span>';
                }).join(', ');
                return '<td style="white-space:normal">' + names + '</td>';
            }).join('');
            return '<tr><td>' + esc(name) + '</td>' + cells + '</tr>';
        }).join('');

        return '<div class="section-title">Ministry Schedule — ' + esc(monthLabel(monthStr)) + '</div>' +
            '<div class="table-wrap"><table class="report-table"><thead><tr><th>Ministry</th>' + headerCells + '</tr></thead><tbody>' +
            rows +
            '</tbody></table></div>';
    }

    function tithesReportHtml(monthStr) {
        var sundays = sundaysInMonth(monthStr);
        if (sundays.length === 0) return '<div class="muted-note">No Sundays found for this month.</div>';
        var tithes = state.data.giving.filter(function (g) { return g.type === 'tithe' && sundays.indexOf(g.date) !== -1; });

        var givers = [];
        tithes.forEach(function (g) {
            var name = g.giver && g.giver.trim() ? g.giver.trim() : 'Unspecified';
            if (givers.indexOf(name) === -1) givers.push(name);
        });

        var byGiverAndDate = {};
        tithes.forEach(function (g) {
            var name = g.giver && g.giver.trim() ? g.giver.trim() : 'Unspecified';
            var key = name + '|' + g.date;
            byGiverAndDate[key] = (byGiverAndDate[key] || 0) + Number(g.amount);
        });

        var weekTotals = sundays.map(function (s) {
            return tithes.filter(function (g) { return g.date === s; }).reduce(function (sum, g) { return sum + Number(g.amount); }, 0);
        });
        var grandTotal = weekTotals.reduce(function (s, v) { return s + v; }, 0);

        var headerCells = sundays.map(function (s, i) {
            return '<th>Week ' + (i + 1) + '<span class="week-sub">' + esc(formatShort(s)) + '</span></th>';
        }).join('') + '<th>Total</th>';

        var giverRows = givers.length ? givers.map(function (name) {
            var rowTotal = 0;
            var cells = sundays.map(function (s) {
                var val = byGiverAndDate[name + '|' + s] || 0;
                rowTotal += val;
                return '<td>' + (val ? esc(currency(val)) : '') + '</td>';
            }).join('');
            return '<tr><td>' + esc(name) + '</td>' + cells + '<td>' + esc(currency(rowTotal)) + '</td></tr>';
        }).join('') : '<tr><td colspan="' + (sundays.length + 2) + '" style="text-align:center;color:var(--muted)">No tithe entries yet.</td></tr>';

        var totalRow = '<tr class="total-row"><td>Total</td>' + weekTotals.map(function (v) { return '<td>' + esc(currency(v)) + '</td>'; }).join('') + '<td>' + esc(currency(grandTotal)) + '</td></tr>';

        function breakdownValues(calc) {
            return weekTotals.map(calc);
        }
        function breakdownRow(label, values) {
            var rowTotal = 0;
            var cells = values.map(function (val) {
                rowTotal += val;
                return '<td>' + esc(currency(val)) + '</td>';
            }).join('');
            return '<tr class="breakdown-row"><td>' + label + '</td>' + cells + '<td>' + esc(currency(rowTotal)) + '</td></tr>';
        }

        var allocItems = state.data.allocationSettings || DEFAULT_ALLOCATION;
        var weekAllocRows = weekTotals.map(function (t) { return calcAllocationRows(t); });
        var breakdownRowsHtml = allocItems.map(function (item, i) {
            var values = weekAllocRows.map(function (rows) { return rows[i] ? rows[i].amount : 0; });
            return breakdownRow(esc(item.title) + ' (' + item.percent + '%)', values);
        }).join('');

        // Total row = explicit sum of the breakdown rows above, not a re-reference to the tithe total.
        var breakdownWeekSums = sundays.map(function (_, wi) {
            return allocItems.reduce(function (sum, item, i) { return sum + (weekAllocRows[wi][i] ? weekAllocRows[wi][i].amount : 0); }, 0);
        });
        var breakdownGrandTotal = breakdownWeekSums.reduce(function (s, v) { return s + v; }, 0);
        var breakdownTotalRow = '<tr class="total-row"><td>Total</td>' + breakdownWeekSums.map(function (v) { return '<td>' + esc(currency(v)) + '</td>'; }).join('') + '<td>' + esc(currency(breakdownGrandTotal)) + '</td></tr>';

        return '<div class="section-title">Tithes — ' + esc(monthLabel(monthStr)) + '</div>' +
            '<div class="table-wrap"><table class="report-table"><thead><tr><th>Tithers</th>' + headerCells + '</tr></thead><tbody>' +
            giverRows + totalRow +
            '</tbody></table></div>' +
            '<div class="table-wrap" style="margin-top:14px"><table class="report-table"><thead><tr><th></th>' + headerCells + '</tr></thead><tbody>' +
            breakdownRowsHtml + breakdownTotalRow +
            '</tbody></table></div>';
    }

    function calcAllocationRows(total) {
        var items = state.data.allocationSettings || DEFAULT_ALLOCATION;
        var remaining = total;
        return items.map(function (item) {
            var amount = remaining * (Number(item.percent) || 0) / 100;
            var deducts = item.deducts !== false;
            if (deducts) remaining -= amount;
            return { id: item.id, title: item.title, percent: item.percent, deducts: deducts, amount: amount };
        });
    }

    function allocationSettingsHtml() {
        if (!state.showAllocationSettings) return '';
        var items = state.data.allocationSettings || DEFAULT_ALLOCATION;
        var rowsHtml = items.map(function (item, i) {
            var deducts = item.deducts !== false;
            return '<div class="alloc-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">' +
                '<input type="text" class="alloc-title" data-id="' + esc(item.id) + '" value="' + esc(item.title) + '" placeholder="Title" style="flex:1;min-width:160px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-family:var(--font-body);font-size:13px" />' +
                '<input type="number" class="alloc-percent" data-id="' + esc(item.id) + '" min="0" max="100" step="0.1" value="' + item.percent + '" style="width:70px;padding:6px 8px;border:1px solid var(--border);border-radius:6px" />' +
                '<span style="font-size:12px;color:var(--muted)">% of remaining</span>' +
                '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--slate)">' +
                '<input type="checkbox" class="alloc-deducts" data-id="' + esc(item.id) + '"' + (deducts ? ' checked' : '') + ' /> reduces remaining for items below' +
                '</label>' +
                '<button type="button" class="btn btn-ghost" data-allocmove="up" data-id="' + esc(item.id) + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
                '<button type="button" class="btn btn-ghost" data-allocmove="down" data-id="' + esc(item.id) + '"' + (i === items.length - 1 ? ' disabled' : '') + '>↓</button>' +
                '<button type="button" class="btn btn-ghost" data-allocremove="' + esc(item.id) + '">Remove</button>' +
                '</div>';
        }).join('');
        return '<div class="manage-box">' +
            '<div class="muted-note" style="margin-bottom:10px">Order matters — each item takes its percent from what\'s currently remaining. Check "reduces remaining for items below" for items that should shrink the pool for the next ones (like tithes-of-tithes or church operation); leave it unchecked for a group that all splits the same leftover pool (like family welfare / local mission / pastor allowance).</div>' +
            '<form id="allocationForm">' + rowsHtml + '<button type="submit" class="btn btn-default" style="margin-top:4px">Save changes</button></form>' +
            '<form id="allocAddForm" style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--border);padding-top:14px">' +
            '<input type="text" id="newAllocTitle" placeholder="New breakdown item title" style="flex:1;min-width:160px" />' +
            '<input type="number" id="newAllocPercent" min="0" max="100" step="0.1" placeholder="%" style="width:80px" />' +
            '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--slate)"><input type="checkbox" id="newAllocDeducts" checked /> reduces remaining</label>' +
            '<button type="submit" class="btn btn-default">Add item</button>' +
            '</form>' +
            '</div>';
    }

    function weeklyTithesBreakdownHtml(date) {
        var tithes = state.data.giving.filter(function (g) { return g.type === 'tithe' && g.date === date; });
        var total = tithes.reduce(function (s, g) { return s + Number(g.amount); }, 0);
        var allocRows = calcAllocationRows(total);

        var rows = [['Total tithes', total, true]].concat(allocRows.map(function (r) {
            return [r.title + ' (' + r.percent + '% of remaining)', r.amount];
        }));

        var rowsHtml = rows.map(function (r) {
            return '<div class="summary-row"' + (r[2] ? ' style="font-weight:600;border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:4px"' : '') + '>' +
                '<span style="color:var(--slate)">' + esc(r[0]) + '</span>' +
                '<span style="font-family:var(--font-mono)">' + esc(currency(r[1])) + '</span></div>';
        }).join('');

        return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
            '<div class="section-title" style="margin-bottom:0">Tithes Breakdown — ' + esc(formatShort(date)) + '</div>' +
            '<button class="manage-toggle" id="toggleAllocation" type="button">' + (state.showAllocationSettings ? 'Hide settings' : 'Edit allocation') + '</button>' +
            '</div>' +
            allocationSettingsHtml() + rowsHtml;
    }

    function exportReportPdf(monthStr) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showImportNotice('PDF library failed to load — check your internet connection and try again.', true);
            return;
        }
        var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
        var pageWidth = doc.internal.pageSize.getWidth();
        var margin = 40;
        var y = 48;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(state.data.churchName || DEFAULT_CHURCH_NAME, pageWidth / 2, y, { align: 'center' });
        y += 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(monthLabel(monthStr), pageWidth / 2, y, { align: 'center' });
        y += 26;

        var sundays = sundaysInMonth(monthStr);
        var weekLabels = sundays.map(function (s) { return formatShort(s); });
        var tableOpts = { styles: { fontSize: 8, cellPadding: 4, halign: 'center' }, headStyles: { fillColor: [34, 49, 79], halign: 'center' }, columnStyles: { 0: { halign: 'left' } }, margin: { left: margin, right: margin } };

        // ---- Summary of Attendees ----
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Summary of Attendees', margin, y);
        y += 10;

        var records = {};
        state.data.attendance.forEach(function (a) { records[a.date] = a; });
        var presentMatrix = state.data.members.map(function (m) {
            return sundays.map(function (s) {
                var rec = records[s];
                return !!(rec && (rec.presentIds || []).indexOf(m.id) !== -1);
            });
        });
        var attendeeBody = state.data.members.map(function (m, mi) {
            return [m.name].concat(presentMatrix[mi].map(function () { return ''; }));
        });
        var memberRowCount = state.data.members.length;
        attendeeBody.push(['Visitors'].concat(sundays.map(function (s) {
            var rec = records[s];
            return rec ? (rec.visitors || []).map(function (v) { return v.name; }).join(', ') : '';
        })));
        doc.autoTable(Object.assign({
            startY: y,
            head: [['Attendees'].concat(weekLabels)],
            body: attendeeBody,
            didDrawCell: function (data) {
                if (data.section !== 'body') return;
                if (data.column.index === 0) return;
                if (data.row.index >= memberRowCount) return;
                if (!presentMatrix[data.row.index][data.column.index - 1]) return;
                var cx = data.cell.x + data.cell.width / 2;
                var cy = data.cell.y + data.cell.height / 2;
                doc.setDrawColor(79, 122, 85);
                doc.setLineWidth(1.1);
                doc.line(cx - 3.5, cy, cx - 1, cy + 2.8);
                doc.line(cx - 1, cy + 2.8, cx + 3.5, cy - 3.2);
            }
        }, tableOpts));
        y = doc.lastAutoTable.finalY + 24;

        // ---- Ministry Schedule ----
        if (y > 680) { doc.addPage(); y = 48; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Ministry Schedule', margin, y);
        y += 10;

        var monthAssignments = state.data.ministry.filter(function (m) { return sundays.indexOf(m.date) !== -1; });
        var presetMinistries = state.data.ministryTypes.slice();
        var ministryNames = presetMinistries.slice();
        monthAssignments.forEach(function (m) { if (ministryNames.indexOf(m.ministry) === -1) ministryNames.push(m.ministry); });
        var ministryBody = ministryNames.map(function (name) {
            return [name].concat(sundays.map(function (s) {
                return monthAssignments
                    .filter(function (m) { return m.date === s && m.ministry === name; })
                    .map(function (m) { return m.status === 'confirmed' ? m.person : m.person + ' (' + m.status + ')'; })
                    .join(', ');
            }));
        });
        doc.autoTable(Object.assign({ startY: y, head: [['Ministry'].concat(weekLabels)], body: ministryBody }, tableOpts));
        y = doc.lastAutoTable.finalY + 24;

        // ---- Tithes ----
        if (y > 620) { doc.addPage(); y = 48; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Tithes', margin, y);
        y += 10;

        var tithes = state.data.giving.filter(function (g) { return g.type === 'tithe' && sundays.indexOf(g.date) !== -1; });
        var givers = [];
        tithes.forEach(function (g) {
            var name = g.giver && g.giver.trim() ? g.giver.trim() : 'Unspecified';
            if (givers.indexOf(name) === -1) givers.push(name);
        });
        var byGiverDate = {};
        tithes.forEach(function (g) {
            var name = g.giver && g.giver.trim() ? g.giver.trim() : 'Unspecified';
            byGiverDate[name + '|' + g.date] = (byGiverDate[name + '|' + g.date] || 0) + Number(g.amount);
        });
        var weekTotals = sundays.map(function (s) {
            return tithes.filter(function (g) { return g.date === s; }).reduce(function (sum, g) { return sum + Number(g.amount); }, 0);
        });
        var grandTotal = weekTotals.reduce(function (s, v) { return s + v; }, 0);

        var tithesBody = givers.map(function (name) {
            var rowTotal = 0;
            var cells = sundays.map(function (s) {
                var val = byGiverDate[name + '|' + s] || 0;
                rowTotal += val;
                return val ? currency(val) : '';
            });
            return [name].concat(cells).concat([currency(rowTotal)]);
        });
        tithesBody.push(['Total'].concat(weekTotals.map(currency)).concat([currency(grandTotal)]));
        doc.autoTable(Object.assign({ startY: y, head: [['Tithers'].concat(weekLabels).concat(['Total'])], body: tithesBody }, tableOpts));
        y = doc.lastAutoTable.finalY + 18;

        if (y > 680) { doc.addPage(); y = 48; }
        var allocItems = state.data.allocationSettings || DEFAULT_ALLOCATION;
        var weekAllocRowsPdf = weekTotals.map(function (t) { return calcAllocationRows(t); });
        var breakdownBody = allocItems.map(function (item, i) {
            var arr = weekAllocRowsPdf.map(function (rows) { return rows[i] ? rows[i].amount : 0; });
            var rowTotal = arr.reduce(function (s, v) { return s + v; }, 0);
            return [item.title + ' (' + item.percent + '%)'].concat(arr.map(currency)).concat([currency(rowTotal)]);
        });
        var totalPerWeek = sundays.map(function (_, wi) {
            return allocItems.reduce(function (sum, item, i) { return sum + (weekAllocRowsPdf[wi][i] ? weekAllocRowsPdf[wi][i].amount : 0); }, 0);
        });
        breakdownBody.push(['Total'].concat(totalPerWeek.map(currency)).concat([currency(totalPerWeek.reduce(function (s, v) { return s + v; }, 0))]));

        doc.autoTable(Object.assign({ startY: y, head: [[''].concat(weekLabels).concat(['Total'])], body: breakdownBody }, tableOpts));

        doc.save('church-report-' + monthStr + '.pdf');
    }

    function attachDashboard() {
        var monthInput = document.getElementById('reportMonth');
        if (monthInput) {
            monthInput.onchange = function (e) {
                state.reportMonth = e.target.value;
                renderContent();
            };
        }
        var exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.onclick = function () { exportReportPdf(state.reportMonth); };
        }
    }

    // ---------- giving ----------
    function givingHtml() {
        var formDate = state.givingFormDate;
        var entries = state.data.giving.filter(function (g) { return g.date === formDate; }).sort(function (a, b) { return a.id > b.id ? 1 : -1; });
        var entriesTotal = entries.reduce(function (s, g) { return s + Number(g.amount); }, 0);

        var monthMap = {};
        state.data.giving.forEach(function (g) { var m = g.date.slice(0, 7); monthMap[m] = (monthMap[m] || 0) + Number(g.amount); });
        var months = Object.keys(monthMap).sort().reverse();

        var entriesHtml = entries.length ? entries.map(function (g) {
            return '<div class="row">' +
                '<div><div class="row-main">' + (g.giver ? esc(g.giver) : 'Tithe') + '</div>' +
                (g.note ? '<div class="row-sub">' + esc(g.note) + '</div>' : '') + '</div>' +
                '<div class="row-actions"><span style="font-family:var(--font-mono);color:var(--sage)">' + esc(currency(g.amount)) + '</span>' +
                '<button class="btn btn-ghost" data-del="' + g.id + '">Remove</button></div></div>';
        }).join('') : '<div class="muted-note">No entries yet for this date.</div>';

        var monthsHtml = months.length ? months.map(function (m) {
            return '<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span style="color:var(--slate)">' + m + '</span><span style="font-family:var(--font-mono)">' + esc(currency(monthMap[m])) + '</span></div>';
        }).join('') : '<div class="muted-note">No data yet.</div>';

        return '<div class="two-col">' +
            '<div class="card">' +
            '<div class="section-title">Record an entry</div>' +
            '<form id="givingForm">' +
            '<div class="field"><label class="font-label">Date</label><input type="date" id="gDate" value="' + esc(formDate) + '" /></div>' +
            '<div class="field"><label class="font-label">Member (optional)</label><input type="text" id="gGiver" list="gGiverDatalist" placeholder="' + esc(memberSearchPlaceholder()) + '" autocomplete="off" />' + memberDatalistHtml('gGiverDatalist') + '</div>' +
            '<div class="field"><label class="font-label">Amount</label><input type="number" step="0.01" min="0" id="gAmount" placeholder="0.00" /></div>' +
            '<div class="field"><label class="font-label">Note (optional)</label><input type="text" id="gNote" placeholder="e.g. building fund" /></div>' +
            '<button type="submit" class="btn btn-default">Add entry</button>' +
            '</form>' +
            '</div>' +
            '<div class="card">' +
            '<div class="section-title">Entries for ' + esc(formatShort(formDate)) + '</div>' +
            entriesHtml +
            (entries.length ? '<div style="margin-top:10px;font-family:var(--font-mono);font-weight:500;font-size:14px">Total: ' + esc(currency(entriesTotal)) + '</div>' : '') +
            '<div style="margin-top:22px;border-top:1px solid var(--border);padding-top:14px">' +
            '<div class="section-title" style="margin-bottom:8px">Monthly summary</div>' + monthsHtml +
            '</div>' +
            '</div>' +
            '<div class="card">' + weeklyTithesBreakdownHtml(formDate) + '</div>' +
            '</div>';
    }

    function attachGiving() {
        document.getElementById('gDate').onchange = function (e) {
            state.givingFormDate = e.target.value;
            renderContent();
        };
        document.getElementById('givingForm').onsubmit = function (e) {
            e.preventDefault();
            var amount = document.getElementById('gAmount').value;
            if (!amount || Number(amount) <= 0) return;
            state.data.giving.push({
                id: uid(),
                date: document.getElementById('gDate').value,
                type: 'tithe',
                giver: document.getElementById('gGiver').value.trim(),
                amount: Number(amount),
                note: document.getElementById('gNote').value
            });
            save();
            renderContent();
        };
        Array.prototype.forEach.call(document.querySelectorAll('[data-del]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-del');
                state.data.giving = state.data.giving.filter(function (g) { return g.id !== id; });
                save();
                renderContent();
            };
        });

        var toggleAllocation = document.getElementById('toggleAllocation');
        if (toggleAllocation) {
            toggleAllocation.onclick = function () {
                state.showAllocationSettings = !state.showAllocationSettings;
                renderContent();
            };
        }
        var allocationForm = document.getElementById('allocationForm');
        if (allocationForm) {
            allocationForm.onsubmit = function (e) {
                e.preventDefault();
                var items = state.data.allocationSettings || DEFAULT_ALLOCATION;
                var next = items.map(function (item) {
                    var titleInput = document.querySelector('.alloc-title[data-id="' + item.id + '"]');
                    var percentInput = document.querySelector('.alloc-percent[data-id="' + item.id + '"]');
                    var deductsInput = document.querySelector('.alloc-deducts[data-id="' + item.id + '"]');
                    return {
                        id: item.id,
                        title: (titleInput ? titleInput.value.trim() : item.title) || item.title,
                        percent: percentInput ? (Number(percentInput.value) || 0) : item.percent,
                        deducts: deductsInput ? !!deductsInput.checked : (item.deducts !== false)
                    };
                });
                state.data.allocationSettings = next;
                state.showAllocationSettings = false;
                save();
                renderContent();
            };
        }
        var allocAddForm = document.getElementById('allocAddForm');
        if (allocAddForm) {
            allocAddForm.onsubmit = function (e) {
                e.preventDefault();
                var title = document.getElementById('newAllocTitle').value.trim();
                if (!title) return;
                var percent = Number(document.getElementById('newAllocPercent').value) || 0;
                var deducts = document.getElementById('newAllocDeducts').checked;
                var items = (state.data.allocationSettings || DEFAULT_ALLOCATION).slice();
                items.push({ id: uid(), title: title, percent: percent, deducts: deducts });
                state.data.allocationSettings = items;
                save();
                renderContent();
            };
        }
        Array.prototype.forEach.call(document.querySelectorAll('[data-allocmove]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-id');
                var dir = btn.getAttribute('data-allocmove');
                var items = (state.data.allocationSettings || DEFAULT_ALLOCATION).slice();
                var index = items.findIndex(function (item) { return item.id === id; });
                var swapWith = dir === 'up' ? index - 1 : index + 1;
                if (index === -1 || swapWith < 0 || swapWith >= items.length) return;
                var temp = items[index];
                items[index] = items[swapWith];
                items[swapWith] = temp;
                state.data.allocationSettings = items;
                save();
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-allocremove]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-allocremove');
                state.data.allocationSettings = (state.data.allocationSettings || DEFAULT_ALLOCATION).filter(function (item) { return item.id !== id; });
                save();
                renderContent();
            };
        });
    }

    // ---------- offering ----------
    function offeringHtml() {
        var formDate = state.offeringFormDate;
        var entries = state.data.offering.filter(function (o) { return o.date === formDate; }).sort(function (a, b) { return a.id > b.id ? 1 : -1; });
        var entriesTotal = entries.reduce(function (s, o) { return s + Number(o.amount); }, 0);

        var expenses = state.data.offeringExpenses.filter(function (e) { return e.date === formDate; }).sort(function (a, b) { return a.id > b.id ? 1 : -1; });
        var expensesTotal = expenses.reduce(function (s, e) { return s + Number(e.amount); }, 0);

        var entriesHtml = entries.length ? entries.map(function (o) {
            return '<div class="row"><div class="row-main">Offering</div>' +
                '<div class="row-actions"><span style="font-family:var(--font-mono);color:var(--sage)">' + esc(currency(o.amount)) + '</span>' +
                '<button class="btn btn-ghost" data-deloffering="' + o.id + '">Remove</button></div></div>';
        }).join('') : '<div class="muted-note">No entries yet for this date.</div>';

        var expensesHtml = expenses.length ? expenses.map(function (e) {
            return '<div class="row"><div class="row-main">' + esc(e.description) + '</div>' +
                '<div class="row-actions"><span style="font-family:var(--font-mono);color:var(--rust)">' + esc(currency(e.amount)) + '</span>' +
                '<button class="btn btn-ghost" data-delexpense="' + e.id + '">Remove</button></div></div>';
        }).join('') : '<div class="muted-note">No expenses recorded for this date.</div>';

        return '<div class="two-col">' +
            '<div class="card">' +
            '<div class="section-title">Record offering</div>' +
            '<form id="offeringForm">' +
            '<div class="field"><label class="font-label">Date</label><input type="date" id="oDate" value="' + esc(formDate) + '" /></div>' +
            '<div class="field"><label class="font-label">Amount</label><input type="number" step="0.01" min="0" id="oAmount" placeholder="0.00" /></div>' +
            '<button type="submit" class="btn btn-default">Add entry</button>' +
            '</form>' +
            '</div>' +
            '<div class="card">' +
            '<div class="section-title">Offering for ' + esc(formatShort(formDate)) + '</div>' +
            entriesHtml +
            (entries.length ? '<div style="margin-top:10px;font-family:var(--font-mono);font-weight:500;font-size:14px">Total: ' + esc(currency(entriesTotal)) + '</div>' : '') +
            '</div>' +
            '<div class="card">' +
            '<div class="section-title">Church expenses (from offering)</div>' +
            '<form id="offeringExpenseForm" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
            '<input type="text" id="oeDescription" placeholder="Expense description" style="flex:1;min-width:140px" />' +
            '<input type="number" step="0.01" min="0" id="oeAmount" placeholder="0.00" style="width:110px" />' +
            '<button type="submit" class="btn btn-default">Add</button>' +
            '</form>' +
            expensesHtml +
            (expenses.length ? '<div style="margin-top:10px;font-family:var(--font-mono);font-weight:500;font-size:14px;color:var(--rust)">Total expenses: ' + esc(currency(expensesTotal)) + '</div>' : '') +
            '<div class="summary-total" style="margin-top:14px"><span style="font-family:var(--font-body)">Net offering</span><span>' + esc(currency(entriesTotal - expensesTotal)) + '</span></div>' +
            '</div>' +
            '</div>';
    }

    function attachOffering() {
        document.getElementById('oDate').onchange = function (e) {
            state.offeringFormDate = e.target.value;
            renderContent();
        };
        document.getElementById('offeringForm').onsubmit = function (e) {
            e.preventDefault();
            var amount = document.getElementById('oAmount').value;
            if (!amount || Number(amount) <= 0) return;
            state.data.offering.push({ id: uid(), date: document.getElementById('oDate').value, amount: Number(amount) });
            save();
            renderContent();
        };
        document.getElementById('offeringExpenseForm').onsubmit = function (e) {
            e.preventDefault();
            var description = document.getElementById('oeDescription').value.trim();
            var amount = document.getElementById('oeAmount').value;
            if (!description || !amount || Number(amount) <= 0) return;
            state.data.offeringExpenses.push({ id: uid(), date: state.offeringFormDate, description: description, amount: Number(amount) });
            save();
            renderContent();
        };
        Array.prototype.forEach.call(document.querySelectorAll('[data-deloffering]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-deloffering');
                state.data.offering = state.data.offering.filter(function (o) { return o.id !== id; });
                save();
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-delexpense]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-delexpense');
                state.data.offeringExpenses = state.data.offeringExpenses.filter(function (e) { return e.id !== id; });
                save();
                renderContent();
            };
        });
    }

    // ---------- rental pledge ----------
    function rentalHtml() {
        var formDate = state.rentalFormDate;
        var entries = state.data.rental.filter(function (r) { return r.date === formDate; }).sort(function (a, b) { return a.id > b.id ? 1 : -1; });
        var entriesTotal = entries.reduce(function (s, r) { return s + Number(r.amount); }, 0);

        var monthMap = {};
        state.data.rental.forEach(function (r) { var m = r.date.slice(0, 7); monthMap[m] = (monthMap[m] || 0) + Number(r.amount); });
        var months = Object.keys(monthMap).sort().reverse();

        var expenses = state.data.rentalExpenses.filter(function (e) { return e.date === formDate; }).sort(function (a, b) { return a.id > b.id ? 1 : -1; });
        var expensesTotal = expenses.reduce(function (s, e) { return s + Number(e.amount); }, 0);

        var entriesHtml = entries.length ? entries.map(function (r) {
            return '<div class="row">' +
                '<div><div class="row-main">' + (r.giver ? esc(r.giver) : 'Rental pledge') + '</div>' +
                (r.note ? '<div class="row-sub">' + esc(r.note) + '</div>' : '') + '</div>' +
                '<div class="row-actions"><span style="font-family:var(--font-mono);color:var(--sage)">' + esc(currency(r.amount)) + '</span>' +
                '<button class="btn btn-ghost" data-delrental="' + r.id + '">Remove</button></div></div>';
        }).join('') : '<div class="muted-note">No entries yet for this date.</div>';

        var monthsHtml = months.length ? months.map(function (m) {
            return '<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span style="color:var(--slate)">' + m + '</span><span style="font-family:var(--font-mono)">' + esc(currency(monthMap[m])) + '</span></div>';
        }).join('') : '<div class="muted-note">No data yet.</div>';

        var expensesHtml = expenses.length ? expenses.map(function (e) {
            return '<div class="row"><div class="row-main">' + esc(e.category) + '</div>' +
                '<div class="row-actions"><span style="font-family:var(--font-mono);color:var(--rust)">' + esc(currency(e.amount)) + '</span>' +
                '<button class="btn btn-ghost" data-delrentexpense="' + e.id + '">Remove</button></div></div>';
        }).join('') : '<div class="muted-note">No bills recorded for this date.</div>';

        return '<div class="two-col">' +
            '<div class="card">' +
            '<div class="section-title">Record a pledge</div>' +
            '<form id="rentalForm">' +
            '<div class="field"><label class="font-label">Date</label><input type="date" id="rDate" value="' + esc(formDate) + '" /></div>' +
            '<div class="field"><label class="font-label">Member (optional)</label><input type="text" id="rGiver" list="rGiverDatalist" placeholder="' + esc(memberSearchPlaceholder()) + '" autocomplete="off" />' + memberDatalistHtml('rGiverDatalist') + '</div>' +
            '<div class="field"><label class="font-label">Amount</label><input type="number" step="0.01" min="0" id="rAmount" placeholder="0.00" /></div>' +
            '<div class="field"><label class="font-label">Note (optional)</label><input type="text" id="rNote" /></div>' +
            '<button type="submit" class="btn btn-default">Add entry</button>' +
            '</form>' +
            '</div>' +
            '<div class="card">' +
            '<div class="section-title">Entries for ' + esc(formatShort(formDate)) + '</div>' +
            entriesHtml +
            (entries.length ? '<div style="margin-top:10px;font-family:var(--font-mono);font-weight:500;font-size:14px">Total: ' + esc(currency(entriesTotal)) + '</div>' : '') +
            '<div style="margin-top:22px;border-top:1px solid var(--border);padding-top:14px">' +
            '<div class="section-title" style="margin-bottom:8px">Monthly summary</div>' + monthsHtml +
            '</div>' +
            '</div>' +
            '<div class="card">' +
            '<div class="section-title">Electric &amp; water bill</div>' +
            '<form id="rentalExpenseForm" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
            '<select id="reCategory" style="flex:1;min-width:120px"><option value="Electric bill">Electric bill</option><option value="Water bill">Water bill</option></select>' +
            '<input type="number" step="0.01" min="0" id="reAmount" placeholder="0.00" style="width:110px" />' +
            '<button type="submit" class="btn btn-default">Add</button>' +
            '</form>' +
            expensesHtml +
            (expenses.length ? '<div style="margin-top:10px;font-family:var(--font-mono);font-weight:500;font-size:14px;color:var(--rust)">Total bills: ' + esc(currency(expensesTotal)) + '</div>' : '') +
            '</div>' +
            '</div>';
    }

    function attachRental() {
        document.getElementById('rDate').onchange = function (e) {
            state.rentalFormDate = e.target.value;
            renderContent();
        };
        document.getElementById('rentalForm').onsubmit = function (e) {
            e.preventDefault();
            var amount = document.getElementById('rAmount').value;
            if (!amount || Number(amount) <= 0) return;
            state.data.rental.push({
                id: uid(),
                date: document.getElementById('rDate').value,
                giver: document.getElementById('rGiver').value.trim(),
                amount: Number(amount),
                note: document.getElementById('rNote').value
            });
            save();
            renderContent();
        };
        document.getElementById('rentalExpenseForm').onsubmit = function (e) {
            e.preventDefault();
            var amount = document.getElementById('reAmount').value;
            if (!amount || Number(amount) <= 0) return;
            state.data.rentalExpenses.push({ id: uid(), date: state.rentalFormDate, category: document.getElementById('reCategory').value, amount: Number(amount) });
            save();
            renderContent();
        };
        Array.prototype.forEach.call(document.querySelectorAll('[data-delrental]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-delrental');
                state.data.rental = state.data.rental.filter(function (r) { return r.id !== id; });
                save();
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-delrentexpense]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-delrentexpense');
                state.data.rentalExpenses = state.data.rentalExpenses.filter(function (e) { return e.id !== id; });
                save();
                renderContent();
            };
        });
    }

    // ---------- attendance ----------
    function getAttendanceRecord(date) {
        return state.data.attendance.filter(function (a) { return a.date === date; })[0] || { id: null, date: date, presentIds: [], visitors: [] };
    }
    function saveAttendanceRecord(record) {
        state.data.attendance = state.data.attendance.filter(function (a) { return a.date !== record.date; });
        if (!record.id) record.id = uid();
        state.data.attendance.push(record);
    }

    function attendanceHtml() {
        var record = getAttendanceRecord(state.selectedDate);
        var presentIds = record.presentIds || [];
        var visitors = record.visitors || [];
        var history = state.data.attendance.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 10);

        var manageBox = state.showManageMembers ? (
            '<div class="manage-box">' +
            '<form id="memberForm" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
            '<input type="text" id="newLastName" placeholder="Member name" style="flex:1;min-width:140px" />' +
            '<select id="newMemberCategory">' + CATEGORIES.map(function (c) { return '<option value="' + c.id + '">' + c.font-label.slice(0, -1) + '</option>'; }).join('') + '</select>' +
            '<button type="submit" class="btn btn-default">Add</button>' +
            '</form>' +
            (state.data.members.length === 0 ? '<div class="muted-note">No members added yet.</div>' :
                state.data.members.map(function (m) {
                    if (state.editingMemberId === m.id) {
                        return '<form class="member-add-row" data-editform="' + m.id + '" style="display:flex;gap:8px;align-items:center;padding:4px 0;flex-wrap:wrap">' +
                            '<input type="text" id="editMemberName" value="' + esc(m.name) + '" style="flex:1;min-width:120px;padding:4px 8px" />' +
                            '<select id="editMemberCategory" style="padding:4px 8px">' +
                            CATEGORIES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === m.category ? ' selected' : '') + '>' + c.font-label.slice(0, -1) + '</option>'; }).join('') +
                            '</select>' +
                            '<button type="submit" class="btn btn-default" style="padding:4px 10px;font-size:12px">Save</button>' +
                            '<button type="button" class="btn btn-ghost" data-canceledit="1" style="padding:4px 10px;font-size:12px;color:var(--slate);border-color:var(--border)">Cancel</button>' +
                            '</form>';
                    }
                    return '<div class="member-row"><span>' + esc(m.name) + ' <span style="color:var(--muted);font-size:11px">(' + esc(m.category) + ')</span></span>' +
                        '<div style="display:flex;gap:6px">' +
                        '<button class="btn btn-ghost" data-editmember="' + m.id + '" style="color:var(--brass-dark);border-color:var(--border)">Change</button>' +
                        '<button class="btn btn-ghost" data-delmember="' + m.id + '">Remove</button>' +
                        '</div></div>';
                }).join('')) +
            '</div>'
        ) : '';

        var categoriesHtml = CATEGORIES.map(function (c) {
            var membersInCat = state.data.members.filter(function (m) { return m.category === c.id; });
            if (membersInCat.length === 0) return '';
            var chips = membersInCat.map(function (m) {
                var present = presentIds.indexOf(m.id) !== -1;
                return '<button class="chip' + (present ? ' present' : '') + '" data-toggle="' + m.id + '" data-name="' + esc(m.name.toLowerCase()) + '">' + (present ? '✓ ' : '') + esc(m.name) + '</button>';
            }).join('');
            return '<div class="cat-block"><div class="cat-label">' + c.font-label + '</div><div class="chip-row">' + chips + '</div></div>';
        }).join('');

        var noMembersNote = state.data.members.length === 0
            ? '<div class="muted-note" style="margin-bottom:14px">Add members above, then tap a name to check them in.</div>' : '';

        var visitorTags = visitors.map(function (v) {
            return '<span class="visitor-tag">' + esc(v.name) + '<button data-delvisitor="' + v.id + '">✕</button></span>';
        }).join('');

        var countsByCategory = CATEGORIES.map(function (c) {
            var membersInCat = state.data.members.filter(function (m) { return m.category === c.id; });
            var presentInCat = membersInCat.filter(function (m) { return presentIds.indexOf(m.id) !== -1; });
            return '<div class="summary-row"><span style="color:var(--slate)">' + c.font-label + '</span><span style="font-family:var(--font-mono)">' + presentInCat.length + '/' + membersInCat.length + '</span></div>';
        }).join('');

        var historyHtml = history.length ? history.map(function (a) {
            var total = (a.presentIds || []).length + (a.visitors || []).length;
            var visitorCount = (a.visitors || []).length;
            return '<div class="row"><span>' + esc(formatShort(a.date)) + '</span>' +
                '<span style="font-family:var(--font-mono)">' + total + ' total' + (visitorCount ? ' · ' + visitorCount + ' new' : '') + '</span></div>';
        }).join('') : '<div class="muted-note">No attendance recorded yet.</div>';

        return '<div class="two-col">' +
            '<div class="card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
            '<div class="section-title" style="margin-bottom:0">Check-in — ' + esc(formatShort(state.selectedDate)) + '</div>' +
            '<button class="manage-toggle" id="toggleManage">' + (state.showManageMembers ? 'Hide member list' : 'Manage members') + '</button>' +
            '</div>' +
            manageBox +
            '<div class="field" style="max-width:280px"><input type="text" id="memberSearch" placeholder="Search members..." value="' + esc(state.attendanceSearch || '') + '" autocomplete="off" /></div>' +
            categoriesHtml + noMembersNote +
            '<div style="margin-top:10px">' +
            '<div class="cat-label">First-time visitors</div>' +
            '<form id="visitorForm" style="display:flex;gap:8px;margin-bottom:8px">' +
            '<input type="text" id="visitorName" placeholder="Visitor name" style="flex:1" />' +
            '<button type="submit" class="btn btn-default">Add</button>' +
            '</form>' +
            '<div class="chip-row">' + visitorTags + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="card">' +
            '<div class="section-title">Summary — ' + esc(formatShort(state.selectedDate)) + '</div>' +
            countsByCategory +
            '<div class="summary-row"><span style="color:var(--slate)">Visitors</span><span style="font-family:var(--font-mono)">' + visitors.length + '</span></div>' +
            '<div class="summary-total"><span style="font-family:var(--font-body)">Total present</span><span>' + (presentIds.length + visitors.length) + '</span></div>' +
            '<div style="margin-top:22px;border-top:1px solid var(--border);padding-top:14px">' +
            '<div class="section-title" style="margin-bottom:8px">Recent Sundays</div>' + historyHtml +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function attachAttendance() {
        var memberSearch = document.getElementById('memberSearch');
        function filterAttendanceChips() {
            var q = (state.attendanceSearch || '').toLowerCase();
            Array.prototype.forEach.call(document.querySelectorAll('.cat-block'), function (block) {
                var anyVisible = false;
                Array.prototype.forEach.call(block.querySelectorAll('.chip'), function (chip) {
                    var match = !q || (chip.getAttribute('data-name') || '').indexOf(q) !== -1;
                    chip.style.display = match ? '' : 'none';
                    if (match) anyVisible = true;
                });
                block.style.display = anyVisible ? '' : 'none';
            });
        }
        if (memberSearch) {
            memberSearch.oninput = function (e) {
                state.attendanceSearch = e.target.value;
                filterAttendanceChips();
            };
            filterAttendanceChips();
        }

        document.getElementById('toggleManage').onclick = function () {
            state.showManageMembers = !state.showManageMembers;
            renderContent();
        };

        var memberForm = document.getElementById('memberForm');
        if (memberForm) {
            memberForm.onsubmit = function (e) {
                e.preventDefault();
                var name = document.getElementById('newLastName').value.trim();
                if (!name) return;
                state.data.members.push({ id: uid(), name: name, category: document.getElementById('newMemberCategory').value });
                save();
                renderContent();
            };
        }
        Array.prototype.forEach.call(document.querySelectorAll('[data-editmember]'), function (btn) {
            btn.onclick = function () {
                state.editingMemberId = btn.getAttribute('data-editmember');
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-canceledit]'), function (btn) {
            btn.onclick = function () {
                state.editingMemberId = null;
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-editform]'), function (form) {
            form.onsubmit = function (e) {
                e.preventDefault();
                var id = form.getAttribute('data-editform');
                var name = document.getElementById('editMemberName').value.trim();
                if (!name) return;
                var category = document.getElementById('editMemberCategory').value;
                state.data.members = state.data.members.map(function (m) {
                    return m.id === id ? Object.assign({}, m, { name: name, category: category }) : m;
                });
                state.editingMemberId = null;
                save();
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-delmember]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-delmember');
                state.data.members = state.data.members.filter(function (m) { return m.id !== id; });
                state.data.attendance = state.data.attendance.map(function (a) {
                    return Object.assign({}, a, { presentIds: (a.presentIds || []).filter(function (pid) { return pid !== id; }) });
                });
                save();
                renderContent();
            };
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-toggle]'), function (chip) {
            chip.onclick = function () {
                var id = chip.getAttribute('data-toggle');
                var record = getAttendanceRecord(state.selectedDate);
                var presentIds = record.presentIds || [];
                record.presentIds = presentIds.indexOf(id) !== -1 ? presentIds.filter(function (pid) { return pid !== id; }) : presentIds.concat([id]);
                saveAttendanceRecord(record);
                save();
                renderContent();
            };
        });

        document.getElementById('visitorForm').onsubmit = function (e) {
            e.preventDefault();
            var name = document.getElementById('visitorName').value.trim();
            if (!name) return;
            var record = getAttendanceRecord(state.selectedDate);
            record.visitors = (record.visitors || []).concat([{ id: uid(), name: name }]);
            saveAttendanceRecord(record);
            save();
            renderContent();
        };
        Array.prototype.forEach.call(document.querySelectorAll('[data-delvisitor]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-delvisitor');
                var record = getAttendanceRecord(state.selectedDate);
                record.visitors = (record.visitors || []).filter(function (v) { return v.id !== id; });
                saveAttendanceRecord(record);
                save();
                renderContent();
            };
        });
    }

    // ---------- ministry ----------
    function ministryHtml() {
        var formDate = state.ministryFormDate;
        var assignments = state.data.ministry.filter(function (m) { return m.date === formDate; });
        var statusColor = { confirmed: 'var(--sage)', pending: 'var(--brass-dark)', declined: 'var(--rust)' };

        var listHtml = assignments.length ? assignments.map(function (m) {
            return '<div class="row">' +
                '<div><div class="row-main">' + esc(m.ministry) + '</div><div class="row-sub">' + esc(m.person) + '</div></div>' +
                '<div class="row-actions">' +
                '<select class="status-select" data-status="' + m.id + '" style="color:' + statusColor[m.status] + '">' +
                '<option value="pending"' + (m.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
                '<option value="confirmed"' + (m.status === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
                '<option value="declined"' + (m.status === 'declined' ? ' selected' : '') + '>Declined</option>' +
                '</select>' +
                '<button class="btn btn-ghost" data-delm="' + m.id + '">Remove</button>' +
                '</div></div>';
        }).join('') : '<div class="muted-note">Nothing scheduled yet.</div>';

        var manageMinistriesBox = state.showManageMinistries ? (
            '<div class="manage-box">' +
            '<form id="ministryTypeForm" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
            '<input type="text" id="newMinistryType" placeholder="New ministry / task name" style="flex:1;min-width:140px" />' +
            '<button type="submit" class="btn btn-default">Add</button>' +
            '</form>' +
            (state.data.ministryTypes.length === 0 ? '<div class="muted-note">No ministry types added yet.</div>' :
                state.data.ministryTypes.map(function (name) {
                    return '<div class="member-row"><span>' + esc(name) + '</span>' +
                        '<button class="btn btn-ghost" data-delministrytype="' + esc(name) + '">Remove</button></div>';
                }).join('')) +
            '</div>'
        ) : '';

        var ministryOptions = state.data.ministryTypes.map(function (name) {
            return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
        }).join('');

        return '<div class="two-col">' +
            '<div class="card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
            '<div class="section-title" style="margin-bottom:0">Assign a ministry</div>' +
            '<button class="manage-toggle" id="toggleManageMinistries" type="button">' + (state.showManageMinistries ? 'Hide ministries' : 'Manage ministries') + '</button>' +
            '</div>' +
            manageMinistriesBox +
            '<form id="ministryForm">' +
            '<div class="field"><label class="font-label">Date</label><input type="date" id="mDate" value="' + esc(formDate) + '" /></div>' +
            '<div class="field"><label class="font-label">Ministry</label><select id="mMinistry">' +
            '<option value="">— Select ministry —</option>' +
            ministryOptions +
            '</select></div>' +
            '<div class="field"><label class="font-label">Assigned to</label><input type="text" id="mPerson" list="mPersonDatalist" placeholder="' + esc(memberSearchPlaceholder()) + '" autocomplete="off" />' + memberDatalistHtml('mPersonDatalist') + '</div>' +
            '<div class="field"><label class="font-label">Status</label><select id="mStatus"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option></select></div>' +
            '<button type="submit" class="btn btn-default">Add assignment</button>' +
            '</form>' +
            '</div>' +
            '<div class="card"><div class="section-title">Schedule — ' + esc(formatShort(formDate)) + '</div>' + listHtml + '</div>' +
            '</div>';
    }

    function attachMinistry() {
        var toggleManageMinistries = document.getElementById('toggleManageMinistries');
        if (toggleManageMinistries) {
            toggleManageMinistries.onclick = function () {
                state.showManageMinistries = !state.showManageMinistries;
                renderContent();
            };
        }
        var ministryTypeForm = document.getElementById('ministryTypeForm');
        if (ministryTypeForm) {
            ministryTypeForm.onsubmit = function (e) {
                e.preventDefault();
                var name = document.getElementById('newMinistryType').value.trim();
                if (!name || state.data.ministryTypes.indexOf(name) !== -1) return;
                state.data.ministryTypes.push(name);
                save();
                renderContent();
            };
        }
        Array.prototype.forEach.call(document.querySelectorAll('[data-delministrytype]'), function (btn) {
            btn.onclick = function () {
                var name = btn.getAttribute('data-delministrytype');
                state.data.ministryTypes = state.data.ministryTypes.filter(function (n) { return n !== name; });
                save();
                renderContent();
            };
        });

        document.getElementById('mDate').onchange = function (e) {
            state.ministryFormDate = e.target.value;
            renderContent();
        };
        document.getElementById('ministryForm').onsubmit = function (e) {
            e.preventDefault();
            var ministry = document.getElementById('mMinistry').value.trim();
            var person = document.getElementById('mPerson').value.trim();
            if (!ministry || !person) return;
            state.data.ministry.push({
                id: uid(),
                date: document.getElementById('mDate').value,
                ministry: ministry,
                person: person,
                status: document.getElementById('mStatus').value
            });
            save();
            renderContent();
        };
        Array.prototype.forEach.call(document.querySelectorAll('[data-status]'), function (sel) {
            sel.onchange = function () {
                var id = sel.getAttribute('data-status');
                state.data.ministry = state.data.ministry.map(function (m) {
                    return m.id === id ? Object.assign({}, m, { status: sel.value }) : m;
                });
                save();
                renderContent();
            };
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-delm]'), function (btn) {
            btn.onclick = function () {
                var id = btn.getAttribute('data-delm');
                state.data.ministry = state.data.ministry.filter(function (m) { return m.id !== id; });
                save();
                renderContent();
            };
        });
    }

    // ---------- init ----------
    renderTopControls();
    renderContent();
})();

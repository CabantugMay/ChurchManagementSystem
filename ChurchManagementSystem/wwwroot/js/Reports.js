
document.addEventListener('DOMContentLoaded', function () {
    loadReports();
    exportButton();
});

async function loadReports() {
    const today = new Date().toISOString().split('T')[0];
    const reportMonth = $('#reportMonth').val() == "" ? today : $('#reportMonth').val();

    const response = await fetch(
        `/Home/GetReport?reportMonth=${encodeURIComponent(reportMonth)}`
    );

    if (!response.ok) {
        console.error('Failed to get attendance report');
        return;
    }

    const data = await response.json();
    const attendance = data[0];
    const ministry = data[1];
    const tithes = data[2];
    const tithesAllocation = data[3];

    loadAttendanceReport(attendance);
    loadMinistryReport(ministry);
    loadTithesReport(tithes);
    loadTithesReportAlloc(tithesAllocation);
   
}

function loadAttendanceReport(attendance) {
    const header = document.getElementById('attendanceTableHeader');
    const tbody = document.getElementById('attendanceTableBody');

    header.innerHTML = '';
    tbody.innerHTML = '';

    if (attendance.length > 0) {

        // Get headers from the first row
        const columns = Object.keys(attendance[0]);

        // Create table headers
        columns.forEach(column => {

            const th = document.createElement('th');

            th.textContent = column;

            header.appendChild(th);
        });

        // Create table rows
        attendance.forEach(row => {

            const tr = document.createElement('tr');

            columns.forEach(column => {
                var isPresent = "";


                const td = document.createElement('td');

                if (column.includes("Week")) {

                    if (row[column] == 1) {
                        td.classList.add("present");
                        td.textContent = "✓";
                    } else {
                        td.classList.add("absent");
                        td.textContent = "";
                    }

                } else {
                    td.textContent = row[column] ?? '';
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    
}

function loadMinistryReport(ministry) {
    const headerMinistry = document.getElementById('ministryTableHeader');
    const bodyMinistry = document.getElementById('ministryTableBody');

    // Clear existing table
    headerMinistry.innerHTML = '';
    bodyMinistry.innerHTML = '';

    if (!ministry || ministry.length === 0) {
        bodyMinistry.innerHTML = `
        <tr>
            <td colspan="5">No ministry report found.</td>
        </tr>
    `;
        return;
    }

    // Get column names from the first row
    const columns = Object.keys(ministry[0]);

    // Create table header
    columns.forEach(column => {
        const th = document.createElement('th');

        // Optional: make SQL column names more readable
        th.textContent = column.replace(/_/g, ' ');

        headerMinistry.appendChild(th);
    });

    // Create table rows
    ministry.forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(column => {
            const td = document.createElement('td');

            td.textContent = row[column] ?? '';

            tr.appendChild(td);
        });

        bodyMinistry.appendChild(tr);
    });
}

function loadTithesReport(tithes) {

    const header = document.getElementById('tithesTableHeader');
    const tbody = document.getElementById('tithesTableBody');

    header.innerHTML = '';
    tbody.innerHTML = '';

    if (!tithes || tithes.length === 0) {
        return;
    }

    const columns = Object.keys(tithes[0]);

    // Tithes header
    columns.forEach(column => {

        const th = document.createElement('th');

        th.textContent = column;

        header.appendChild(th);
    });

    // Tithes rows
    tithes.forEach(row => {

        const tr = document.createElement('tr');

        columns.forEach(column => {

            const td = document.createElement('td');

            td.textContent = row[column] ?? '';

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}


function loadTithesReportAlloc(tithesAllocation) {

    const tbody = document.getElementById('tithesTableBody');

    if (!tithesAllocation || tithesAllocation.length === 0) {
        return;
    }

    const columns = Object.keys(tithesAllocation[0]);

    // Add spacing/title row
    const titleRow = document.createElement('tr');

    const titleCell = document.createElement('th');

    titleCell.colSpan = columns.length;
    titleCell.textContent = 'Tithes Allocation';
    titleCell.classList.add('header-table');

    titleRow.appendChild(titleCell);
    tbody.appendChild(titleRow);

    

    // Allocation rows
    tithesAllocation.forEach(row => {

        const tr = document.createElement('tr');

        columns.forEach(column => {

            const td = document.createElement('td');

            td.textContent = row[column] ?? '';

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function exportButton() {

    const exportButton = document.getElementById('btnExportPDF');

    if (!exportButton) {
        console.error('Export PDF button not found.');
        return;
    }

    exportButton.addEventListener('click', async function () {

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        await loadUnicodeFont(doc);

        const reportMonth =
            document.getElementById('reportMonth')?.value || '';

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');

        doc.text(
            'Almighty God Covenant Church - Mariveles',
            105,
            15,
            { align: 'center' }
        );

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        doc.text(
            `Monthly Report${reportMonth ? ' - ' + reportMonth : ''}`,
            105,
            23,
            { align: 'center' }
        );


        // Attendance
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary of Attendees', 14, 35);

        doc.autoTable({
            html: '#content-attendance table',
            startY: 40,
            theme: 'grid',
            styles: {
                font: 'DejaVuSans',
                fontSize: 9,
                cellPadding: 3,
                halign: 'center'
            },
            headStyles: {
                font: 'DejaVuSans',
                halign: 'center',
                fillColor: [34, 49, 79]
            },
            columnStyles: {
                0: {
                    halign: 'left'
                }
            },
            alternateRowStyles: {
                fillColor: [245, 248, 252]
            },
            didParseCell: function (data) {
                if (
                    data.section === 'body' &&
                    data.column.index > 0 &&
                    data.cell.text[0] === '✓'
                ) {
                    data.cell.styles.textColor = [22, 61, 115];
                }
            }
        });


        // Ministry
        const ministryY = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Ministry Schedule', 14, ministryY);

        doc.autoTable({
            html: '#content-ministry-report table',
            startY: ministryY + 5,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: 'center'
            },
            headStyles: {
                halign: 'center',
                fillColor: [34, 49, 79]
            },
            columnStyles: {
                0: {
                    halign: 'left'
                }
            },
            alternateRowStyles: {
                fillColor: [245, 248, 252]
            }
        });


        // Financials
        doc.addPage();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Report - Tithes', 14, 20);

        doc.autoTable({
            html: '#content-financials-report table',
            startY: 25,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: 'center'
            },
            headStyles: {
                halign: 'center',
                fillColor: [34, 49, 79]
            },
            columnStyles: {
                0: {
                    halign: 'left'
                }
            },
            alternateRowStyles: {
                fillColor: [245, 248, 252]
            }
        });


        // Save
        const filename = reportMonth
            ? `Church_Report_${reportMonth}.pdf`
            : 'Church_Report.pdf';

        doc.save(filename);

    });
}

async function loadUnicodeFont(doc) {
    const response = await fetch('/fonts/DejaVuSans.ttf');

    if (!response.ok) {
        throw new Error('Could not load DejaVuSans.ttf');
    }

    const arrayBuffer = await response.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    const base64 = btoa(binary);

    doc.addFileToVFS('DejaVuSans.ttf', base64);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
}
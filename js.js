const dateFormat = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

document.getElementById('backDayButton').addEventListener('click', (e) => {
    updateDayByAmount(-1);
})

document.getElementById('dateInput').addEventListener('change', (e) => {
    date = e.target.value;
    addRowsForDay(date);
});

document.getElementById('nextDayButton').addEventListener('click', (e) => {
    updateDayByAmount(1);
})

document.getElementById('addButton').addEventListener('click', (e) => {
    const now = new Date;
    const time = timeFormat.format(now);

    let days = JSON.parse(localStorage.getItem('days'));
    let newEntryId = days[date].length;
    if (days[date][newEntryId-1]?.start === time) {
        return;
    }
    if (days[date][newEntryId-1] && days[date][newEntryId-1].stop === '') {
        days[date][newEntryId-1].stop = time;
    }

    days[date].push({
        id: newEntryId,
        start: time,
        stop: '',
        notes: ''
    });

    localStorage.setItem('days', JSON.stringify(days));

    location.reload()
    // addRow({start: time});
});

document.getElementById('saveButton').addEventListener('click', (e) => {
    saveRows();
});

document.getElementById('downloadButton').addEventListener('click', (e) => {
    let days = JSON.parse(localStorage.getItem('days'));
    let sortedDays = Object.keys(days).sort().reduce((newDays, key) => {
        newDays[key] = days[key];
        return newDays;
    }, {});

    let csv = 'data:text/csv;charset=utf-8,\uFEFF'
    for (let date in sortedDays) {
        csv += date + '\n'
        for (let entryKey in sortedDays[date]) {
            const entry = sortedDays[date][entryKey];
            const notes = entry['notes'].replace("\"", "\"\"");
            csv += encodeURIComponent(`"${entry['start']}","${entry['stop']}","${notes}"\n`);
        }
    }
    const now = new Date;
    const todaysDate = dateFormat.format(now);
    const time = timeFormat.format(now);
    const anchor = document.createElement('a');
    anchor.href = csv;
    anchor.download = `tiny_time_${todaysDate}_${time}.csv`;
    anchor.click();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRows();
    }
})

const addRow = ({id = -1, start = '', stop = '', notes = ''}) => {
    let rowTemplate = document.getElementById('rowTemplate');

    let newRow = rowTemplate.cloneNode(true);
    newRow.id = 'row_' + id;
    document.getElementById('rows').appendChild(newRow);

    newRow.querySelector('.start').value = start;
    newRow.querySelector('.stop').value = stop;
    newRow.querySelector('.notes').value = notes;
    newRow.hidden = false;

    newRow.querySelector('.remove').addEventListener('click', (e) => {
        if (confirm("This will delete the entry with these notes: " + newRow.querySelector('.notes').value)) {
            newRow.remove();
            days[date] = days[date].filter((entry) => entry.id !== id);
            localStorage.setItem('days', JSON.stringify(days));
        }
    });
};

const saveRows = () => {
    let days = JSON.parse(localStorage.getItem('days'));

    let rowElements = document.getElementById('rows').children;
    
    let newEntries = [];
    let idCount = 0;
    Array.from(rowElements).map(rowElement => {
        newEntries.push({
            id: idCount,
            start: rowElement.querySelector('.start').value,
            stop: rowElement.querySelector('.stop').value,
            notes: rowElement.querySelector('.notes').value,
        });
        idCount++;
    });
    days[date] = newEntries;

    localStorage.setItem('days', JSON.stringify(days));
}

const addRowsForDay = (date) => {
    sessionStorage.setItem('date', date);

    let days = JSON.parse(localStorage.getItem('days'));
    if (!days) {
        days = {};
    };
    if (!days?.[date]) days[date] = [];
    localStorage.setItem('days', JSON.stringify(days));

    let rowsElement = document.getElementById('rows');
    rowsElement.innerHTML = '';

    days[date].map((entry) => {
        addRow(entry);
    })
}

const updateDayByAmount = (amount) => {
    let datePieces = date.split('-');
    let changedDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2] + +amount)
    date = dateFormat.format(changedDate);
    document.getElementById('dateInput').value = date;
    addRowsForDay(date);
}

const now = new Date;
let date = sessionStorage.getItem('date');
if (!date) date = dateFormat.format(now);
document.getElementById('dateInput').value = date;

addRowsForDay(date);
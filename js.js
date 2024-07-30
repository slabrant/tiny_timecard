document.getElementById('backDayButton').addEventListener('click', (e) => {
    if (checkRowsEqual() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDayByAmount(-1);
})

document.getElementById('dateInput').addEventListener('change', (e) => {
    if (checkRowsEqual() || confirm("You have unsaved data that will be lost. Would you like to continue?")) {
        date = e.target.value;
        addRowsForDay(date);
    }
    else {
        e.target.value = date;
    }
});

document.getElementById('nextDayButton').addEventListener('click', (e) => {
    if (checkRowsEqual() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDayByAmount(1);
})

document.getElementById('addButton').addEventListener('click', (e) => {
    const now = new Date;
    let time = timeFormat.format(now);

    let days = getDays();
    let newEntryId = days[date].length;
    if (days[date][newEntryId-1]?.start === time) {
        return;
    }
    if (days[date][newEntryId-1]) {
        let entryStop = days[date][newEntryId - 1].stop;

        if (entryStop === '') 
            days[date][newEntryId - 1].stop = time;
        else 
            time = entryStop;
    }

    days[date].push({
        id: newEntryId,
        start: time,
        stop: '',
        notes: ''
    });

    saveDays(days);
    location.reload();
});

document.getElementById('saveButton').addEventListener('click', (e) => {
    savePageData();
    checkRowsEqual();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        savePageData();
        checkRowsEqual();
    }
});

document.getElementById('downloadButton').addEventListener('click', (e) => {
    let days = getDays();

    let csv = 'data:text/csv;charset=utf-8,\uFEFF'
    for (let date in days) {
        csv += date + '\n'
        for (let entryKey in days[date]) {
            const entry = days[date][entryKey];
            const notes = entry['notes'].replace("\"", "\"\"");
            csv += encodeURIComponent(`"${entry['start']}","${entry['stop']}","${notes}"\n`);
        }
    }
    
    const now = new Date;
    const anchor = document.createElement('a');
    anchor.href = csv;
    anchor.download = `tiny_time_${dateFormat.format(now)}_${timeFormat.format(now)}.csv`;
    anchor.click();
});

document.getElementById('uploadButton').addEventListener('change', (e) => {
    const [file] = e.target.files;
    const reader = new FileReader();

    reader.addEventListener('load', () => {
        let newDays = {};
        let date = '';
        let id = 0;
        reader.result.split(/\r?\n/).map(line => {
            let start = '';
            let stop = '';
            line = line.replaceAll('"', '');

            if (5 < line.indexOf(','))
                line = line.substr(0, line.indexOf(','));

            if (line.indexOf(',') === -1) {
                let datePieces = line.split('-');
                let newDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2]);
                if (newDate instanceof Date && !isNaN(newDate)) {
                    date = dateFormat.format(newDate);
                    newDays[date] = [];
                    id = 0;
                }
            }
            else if (date !== '') {
                start = line.substr(0, line.indexOf(','));
                line = line.substr(line.indexOf(',') + 1);
                stop = line.substr(0, line.indexOf(','));
                notes = line.substr(line.indexOf(',') + 1);

                newDays[date].push({
                    id: id,
                    start: start,
                    stop: stop,
                    notes: notes,
                });
                id++;
            }
        });

        let days = getDays();
        let areRowsEqual = checkObjectsEqual(newDays, days);
        if (areRowsEqual) {
            alert('There is no new data to upload.');
        }
        else if (confirm("Warning: This will overwrite your data. Recovery is not possible. Would you like to continue?")) {
            saveDays(newDays);
        }
    });

    if (file) {
        reader.readAsText(file);
        e.target.value = '';
    }
});

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

const addRow = ({id = -1, start = '', stop = '', notes = ''}) => {
    let rowTemplate = document.getElementById('rowTemplate');

    let newRow = rowTemplate.cloneNode(true);
    newRow.id = 'row_' + id;
    document.getElementById('rows').appendChild(newRow);

    newRow.querySelector('.start').value = start;
    newRow.querySelector('.stop').value = stop;
    newRow.querySelector('.notes').value = notes;
    newRow.hidden = false;

    Array.from(newRow.getElementsByTagName('input')).map(input => {
        input.addEventListener('blur', (e) => {
            checkRowsEqual();
        })
    });

    newRow.querySelector('.remove').addEventListener('click', (e) => {
        // let start = newRow.querySelector('.start').value; ${start} TODO: This needs a human-readable time format to be used.
        if (confirm(`This will delete this entry. Would you like to continue?`)) {
            let days = getDays();
            newRow.remove();
            days[date] = days[date].filter((entry) => entry.id !== id);
            saveDays(days);
        }
    });
};

const addRowsForDay = (date) => {
    sessionStorage.setItem('date', date);

    let days = getDays();

    document.getElementById('rows').innerHTML = '';

    days[date]?.map((entry) => {
        addRow(entry);
    })
};

const checkObjectsEqual = (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const checkRowsEqual = () => {
    let pageData = getRowsData();
    let days = getDays();

    let areRowsEqual = checkObjectsEqual(pageData, days[date]);
    
    if (areRowsEqual) {
        document.getElementById('saveButton').classList.remove('primary');
    }
    else {
        document.getElementById('saveButton').classList.add('primary');
    }

    return areRowsEqual;
};

const getDays = () => {
    let days = JSON.parse(localStorage.getItem('days'));

    if (!days)
        days = {};
    if (!days[date])
        days[date] = [];

    return days;
};

const getRowsData = () => {
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
    return newEntries;
};

const saveDays = (days) => {
    let sortedDays = Object.keys(days).sort().reduce((newDays, key) => {
        if (0 < days[key].length) 
            newDays[key] = days[key];
        return newDays;
    }, {});

    localStorage.setItem('days', JSON.stringify(sortedDays));
};

const savePageData = () => {
    let days = getDays();

    days[date] = getRowsData();

    saveDays(days);
};

const updateDayByAmount = (amount) => {
    let datePieces = date.split('-');
    let changedDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2] + +amount);
    date = dateFormat.format(changedDate);
    document.getElementById('dateInput').value = date;
    addRowsForDay(date);
}

const now = new Date;
let date = sessionStorage.getItem('date');
if (!date) 
    date = dateFormat.format(now);

document.getElementById('dateInput').value = date;

addRowsForDay(date);
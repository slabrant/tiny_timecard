document.getElementById('backDayButton').addEventListener('click', (e) => {
    if (checkDaysEqual() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDateByAmount(-1);
});

document.getElementById('dateInput').addEventListener('change', (e) => {
    if (checkDaysEqual() || confirm("You have unsaved data that will be lost. Would you like to continue?")) {
        date = e.target.value;
        setPageData(date);
        checkDaysEqual();
    }
    else {
        e.target.value = date;
    }
});

document.getElementById('nextDayButton').addEventListener('click', (e) => {
    if (checkDaysEqual() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDateByAmount(1);
});

document.getElementById('addButton').addEventListener('click', (e) => {
    const now = new Date;
    let time = timeFormat.format(now);
    let entries = getEntries(date);
    let newEntryId = entries.length;

    if (entries[newEntryId-1]?.start === time)
        return;

    if (entries[newEntryId-1]) {
        let entryStop = entries[newEntryId - 1].stop;

        if (entryStop === '') 
            entries[newEntryId - 1].stop = time;
        else 
            time = entryStop;
    }

    entries.push({
        id: newEntryId,
        start: time,
        stop: '',
        notes: ''
    });

    saveEntries(entries, date);
    location.reload();
});

document.getElementById('saveButton').addEventListener('click', (e) => {
    saveDay(getPageData(), date);
    checkDaysEqual();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDay(getPageData(), date);
        checkDaysEqual();
    }
});

document.getElementById('downloadButton').addEventListener('click', (e) => {
    let days = getDays();
    let csv = 'data:text/csv;charset=utf-8,\uFEFF';

    for (let date in days) {
        csv += date + '\n'
        for (let entryKey in days[date].entries) {
            const entry = days[date].entries[entryKey];
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
                    newDays[date] = {
                        "entries": [],
                        "notes": "",
                    };
                    id = 0;
                }
            }
            else if (date !== '') {
                start = line.substr(0, line.indexOf(','));
                line = line.substr(line.indexOf(',') + 1);
                stop = line.substr(0, line.indexOf(','));
                notes = line.substr(line.indexOf(',') + 1);

                newDays[date].entries.push({
                    id: id,
                    start: start,
                    stop: stop,
                    notes: notes,
                });
                id++;
            }
        });
                    
        let reducedDays = Object.keys(newDays).sort().reduce((days, key) => {
            if (0 < newDays[key].entries.length || 0 < newDays[key].notes.length)
                days[key] = newDays[key];
            return days;
        }, {});

        let areRowsEqual = checkObjectsEqual(reducedDays, getDays());

        if (areRowsEqual)
            alert('There is no new data to upload.');
        else if (confirm("Warning: This will overwrite your data. Recovery is not possible. Would you like to continue?"))
            saveDays(reducedDays);
    });

    if (file) {
        reader.readAsText(file);
        e.target.value = '';
    }
});

document.getElementById('dayNotes').addEventListener('blur', (e) => {
    checkDaysEqual();
})

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
            checkDaysEqual();
        })
    });

    newRow.querySelector('.remove').addEventListener('click', (e) => {
        // let start = newRow.querySelector('.start').value; ${start} TODO: This needs a human-readable time format to be used.
        if (confirm(`This will delete this entry. Would you like to continue?`)) {
            newRow.remove();
            const entries = getEntries(date).filter((entry) => entry.id !== id);
            saveEntries(entries, date);
        }
    });
};

const checkObjectsEqual = (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const checkDaysEqual = () => {
    let areRowsEqual = checkObjectsEqual(getPageData(), getDay(date));
    
    if (areRowsEqual)
        document.getElementById('saveButton').classList.remove('primary');
    else
        document.getElementById('saveButton').classList.add('primary');

    return areRowsEqual;
};

const getDay = (date) => {
    let days = JSON.parse(localStorage.getItem('days')) || {};

    if (!days[date]) {
        days[date] = {
            "entries": [],
            "notes": "",
        };
    }

    return days[date];
};

const getDays = () => {
    return JSON.parse(localStorage.getItem('days')) || {};
};

const getEntries = (date) => {
    return getDay(date).entries || [];
};

const getPageData = () => {
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

    let dayNotes = document.getElementById('dayNotes').value;

    return {
        "entries": newEntries,
        "notes": dayNotes,
    };
};

const saveEntries = (entries, date) => {
    if (entries.length === 0)
        return;

    let days = getDays();
    if (!days[date])
        days[date] = { "notes": "" };

    days[date].entries = entries;

    localStorage.setItem('days', JSON.stringify(days));
};

const saveDay = (day, date) => {
    if (day.entries.length === 0 && day.notes.length === 0)
        return;

    let days = getDays();
    days[date] = day;

    localStorage.setItem('days', JSON.stringify(days));
};

const saveDays = (days) => {
    localStorage.setItem('days', JSON.stringify(days));
    setPageData(date);
};

const setPageData = (date) => {
    sessionStorage.setItem('date', date);
    let day = getDay(date);

    document.getElementById('rows').innerHTML = '';

    day.entries.map((entry) => {
        addRow(entry);
    });

    document.getElementById('dayNotes').value = day.notes;
};

const updateDateByAmount = (amount) => {
    let datePieces = date.split('-');
    let changedDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2] + +amount);
    date = dateFormat.format(changedDate);
    document.getElementById('dateInput').value = date;
    setPageData(date);
    checkDaysEqual();
};

let date = sessionStorage.getItem('date') || dateFormat.format(new Date);
document.getElementById('dateInput').value = date;
setPageData(date);

'use strict';

document.getElementById('backDayButton').addEventListener('click', (e) => {
    if (checkPageChanged() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDateByAmount(-1);
});

document.getElementById('dateInput').addEventListener('change', (e) => {
    if (checkPageChanged() || confirm("You have unsaved data that will be lost. Would you like to continue?")) {
        date = e.target.value;
        setPageData(date);
        checkPageChanged();
    }
    else {
        e.target.value = date;
    }
});

document.getElementById('nextDayButton').addEventListener('click', (e) => {
    if (checkPageChanged() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDateByAmount(1);
});

document.getElementById('addButton').addEventListener('click', (e) => {
    const now = new Date;
    let time = timeFormat.format(now);
    let entries = getPageData().entries;
    const previousEntry = entries[entries.length - 1];

    if (previousEntry?.start === time)
        return;

    if (previousEntry) {
        if (previousEntry.stop === '')
            previousEntry.stop = time;
        else
            time = previousEntry.stop;

        getRowElements().pop().querySelector('.stop').value = previousEntry.stop;
    }

    const newEntry = {
        start: time,
        stop: '',
        notes: ''
    };
    entries.push(newEntry);
    addRow(newEntry);

    saveEntries(entries, date);
    setPomodoroTimer(time, entries.length - 1);
});

document.getElementById('saveButton').addEventListener('click', (e) => {
    saveDay(getPageData(), date);
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDay(getPageData(), date);
    }
});

document.getElementById('downloadButton').addEventListener('click', (e) => {
    const blob = new Blob([buildCsv(getDays())], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);

    const now = new Date;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tiny_time_${dateFormat.format(now)}_${timeFormat.format(now)}.csv`;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
});

document.getElementById('uploadButton').addEventListener('change', (e) => {
    const [file] = e.target.files;
    const reader = new FileReader();

    reader.addEventListener('load', () => {
        let newDays = {};
        let date = '';

        parseCsv(reader.result).forEach(fields => {
            if (fields.every(field => field === ''))
                return;

            // A row starting with a date begins a new day, and may carry that day's notes.
            if (/^\d{4}-\d{2}-\d{2}$/.test(fields[0])) {
                const datePieces = fields[0].split('-');
                const newDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2]);
                if (!isNaN(newDate)) {
                    date = dateFormat.format(newDate);
                    newDays[date] = {
                        "entries": [],
                        "notes": fields[1] || '',
                    };
                }
            }
            else if (date !== '') {
                newDays[date].entries.push({
                    start: fields[0] || '',
                    stop: fields[1] || '',
                    notes: fields[2] || '',
                });
            }
        });

        let areRowsEqual = checkDaysEqual(newDays, getDays());

        if (areRowsEqual)
            alert('There is no new data to upload.');
        else if (confirm("This will overwrite your data. Recovery is not possible. Would you like to continue?"))
            saveDays(newDays);
    });

    if (file) {
        reader.readAsText(file);
        e.target.value = '';
    }
});

document.getElementById('pomodoroInput').addEventListener('click', (e) => {
    pomodoroOn = e.target.checked;
    localStorage.setItem('pomodoroOn', pomodoroOn);
    document.getElementById('pomodoroDisplay').hidden = !pomodoroOn;
    document.getElementById('pomodoroTimesInput').hidden = !pomodoroOn;
    resetPomodoroTimer();
});

document.getElementById('pomodoroTimesInput').addEventListener('change', (e) => {
    const times = parsePomodoroTimes(e.target.value);

    if (times)
        localStorage.setItem('pomodoroTimes', JSON.stringify(times));

    // Unusable text is dropped, so the field always shows the times actually in effect.
    e.target.value = getPomodoroTimes().join(',');
    restartPomodoroTimer();
});

document.getElementById('dayNotes').addEventListener('input', (e) => {
    checkPageChanged();
    e.target.rows = (e.target.value.match(/\n/g) || []).length + 1;
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
const displayTimeFormat = new Intl.DateTimeFormat('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

const addRow = ({start = '', stop = '', notes = ''}) => {
    let rowTemplate = document.getElementById('rowTemplate');

    let newRow = rowTemplate.cloneNode(true);
    newRow.removeAttribute('id');
    newRow.classList.add('row');
    document.getElementById('rows').appendChild(newRow);

    newRow.querySelector('.start').value = start;
    newRow.querySelector('.stop').value = stop;
    newRow.querySelector('.notes').value = notes;
    newRow.hidden = false;

    Array.from(newRow.getElementsByTagName('input')).forEach(input => {
        input.addEventListener('input', () => {
            checkPageChanged();
            if (input.classList.contains('start') && newRow === getRowElements().pop())
                setPomodoroTimer(input.value, getRowIndex(newRow));
        })
        if (!input.classList.contains('notes')) {
            input.addEventListener('focus', e => {
                if ('' === e.target.value) {
                    const now = new Date;
                    e.target.value = timeFormat.format(now);
                    checkPageChanged();
                }
            });
            input.addEventListener('keydown', e => {
                if ('Backspace' === e.key) {
                    e.target.value = '';
                    checkPageChanged();
                }
            });
        }
    });

    newRow.querySelector('.remove').addEventListener('click', (e) => {
        const now = new Date;
        const startArr = newRow.querySelector('.start').value.split(':');
        let message = 'This will delete the entry. Would you like to continue?';
        if (1 < startArr.length) {
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startArr[0], +startArr[1]);
            message = `This will delete the entry starting at ${displayTimeFormat.format(startDate)}. Would you like to continue?`;
        }
        if (confirm(message)) {
            newRow.remove();
            const entries = getPageData().entries;
            saveEntries(entries, date);
            setPomodoroTimer(entries[entries.length - 1]?.start, entries.length - 1);
        }
    });
};

const buildCsv = (days) => {
    let csv = '\uFEFF';

    for (let date in days) {
        csv += csvRow([date, days[date].notes]);
        days[date].entries.forEach(entry => {
            csv += csvRow([entry.start, entry.stop, entry.notes]);
        });
    }

    return csv;
};

const checkDayEqual = (day1, day2) => {
    return (JSON.stringify(day1.entries) === JSON.stringify(day2.entries)) && (day1.notes === day2.notes)
};

const checkDaysEqual = (days1, days2) => {
    let dates1 = Object.keys(days1);
    let dates2 = Object.keys(days2);

    if (JSON.stringify(dates1) !== JSON.stringify(dates2)) return false;

    return dates1.reduce((accumulator, date) => {
        return accumulator && checkDayEqual(days1[date], days2[date]);
    }, true);
}

const checkPageChanged = () => {
    let areRowsEqual = checkDayEqual(getPageData(), getDay(date));

    if (areRowsEqual)
        document.getElementById('saveButton').classList.remove('primary');
    else
        document.getElementById('saveButton').classList.add('primary');

    return areRowsEqual;
};

const csvRow = (fields) => {
    return fields.map(field => `"${String(field).replaceAll('"', '""')}"`).join(',') + '\n';
};

const getDay = (date) => {
    return normalizeDay(getDays()[date]);
};

const getDays = () => {
    let days = JSON.parse(localStorage.getItem('days')) || {};

    for (let date in days) {
        days[date] = normalizeDay(days[date]);
    }

    return days;
};

const getPageData = () => {
    let newEntries = getRowElements().map(rowElement => {
        return {
            start: rowElement.querySelector('.start').value,
            stop: rowElement.querySelector('.stop').value,
            notes: rowElement.querySelector('.notes').value,
        };
    });

    let dayNotes = document.getElementById('dayNotes').value;

    return {
        "entries": newEntries,
        "notes": dayNotes,
    };
};

const getPomodoroMessageAndDelay = (start, entryId) => {
    const pomodoroTimes = getPomodoroTimes();

    // A leading zero shifts the cycle so it starts on a break instead of a work period.
    const startsOnBreak = (pomodoroTimes[0] === 0);
    const cycle = startsOnBreak ? pomodoroTimes.slice(1) : pomodoroTimes;

    const pomoCount = entryId % cycle.length;
    const pomodoroTime = cycle[pomoCount];
    const isBreak = ((pomoCount % 2) === 1) !== startsOnBreak;
    const pomodoroType = isBreak ? "Break" : "Work";

    const nowMs = Date.now();
    const now = new Date;
    const lastStartTimeArr = start.split(':');
    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lastStartTimeArr[0], +lastStartTimeArr[1] + pomodoroTime);
    const delay = newDate - nowMs;

    const message = pomodoroType + " until " + displayTimeFormat.format(newDate);

    return [message, delay, pomodoroType];
}

const getPomodoroTimes = () => {
    const storedTimes = JSON.parse(localStorage.getItem('pomodoroTimes'));

    if (Array.isArray(storedTimes) && parsePomodoroTimes(storedTimes.join(',')))
        return storedTimes;

    // The original {work, short, long} setting is the same cycle as work, short, work, short, work, short, work, long.
    const {work = 25, short = 5, long = 25} = (storedTimes instanceof Object) ? storedTimes : {};

    return [work, short, work, short, work, short, work, long];
};

const getRowElements = () => {
    return Array.from(document.getElementById('rows').children);
};

const getRowIndex = (rowElement) => {
    return getRowElements().indexOf(rowElement);
};

const normalizeDay = (day) => {
    return {
        "entries": (day?.entries || []).map(normalizeEntry),
        "notes": day?.notes || '',
    };
};

const normalizeEntry = ({start = '', stop = '', notes = ''}) => {
    return {
        start: start,
        stop: stop,
        notes: notes,
    };
};

// Splits CSV text into rows of fields, keeping commas, quotes, and newlines that sit inside quoted fields.
const parseCsv = (text) => {
    let rows = [];
    let fields = [];
    let field = '';
    let inQuotes = false;

    if (text.startsWith('\uFEFF'))
        text = text.substr(1);

    for (let i = 0; i < text.length; i++) {
        const character = text[i];

        if (inQuotes) {
            if (character === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            }
            else if (character === '"')
                inQuotes = false;
            else
                field += character;
        }
        else if (character === '"')
            inQuotes = true;
        else if (character === ',') {
            fields.push(field);
            field = '';
        }
        else if (character === '\n' || character === '\r') {
            if (character === '\r' && text[i + 1] === '\n')
                i++;
            fields.push(field);
            rows.push(fields);
            fields = [];
            field = '';
        }
        else
            field += character;
    }

    if (field !== '' || 0 < fields.length) {
        fields.push(field);
        rows.push(fields);
    }

    return rows;
};

// Reads a comma separated list of minutes, and returns null if it is not usable as a pomodoro cycle.
const parsePomodoroTimes = (text) => {
    const times = text.split(',')
        .map(piece => piece.trim())
        .filter(piece => piece !== '')
        .map(Number);

    if (times.length === 0 || times.some(time => !Number.isInteger(time) || time < 0))
        return null;

    // A leading zero only marks the cycle as starting on a break, so it needs a period after it.
    if (times[0] === 0 && times.length < 2)
        return null;

    return times;
};

const resetPomodoroTimer = () => {
    if (pomodoroTimeout) {
        clearTimeout(pomodoroTimeout);
        pomodoroTimeout = undefined;
        document.getElementById('pomodoroDisplay').innerText = "Click to activate pomodoro timer.";
    }
};

const restartPomodoroTimer = () => {
    const entries = getPageData().entries;
    setPomodoroTimer(entries[entries.length - 1]?.start, entries.length - 1);
};

const saveEntries = (entries, date) => {
    let days = getDays();
    if (!days[date])
        days[date] = normalizeDay();

    days[date].entries = entries;

    localStorage.setItem('days', JSON.stringify(days));
    checkPageChanged();
};

const saveDay = (day, date) => {
    let days = getDays();
    days[date] = day;

    localStorage.setItem('days', JSON.stringify(days));
    checkPageChanged();
};

const saveDays = (days) => {
    localStorage.setItem('days', JSON.stringify(days));
    setPageData(date);
};

const setPageData = (date) => {
    sessionStorage.setItem('date', date);
    let day = getDay(date);
    document.getElementById('rows').innerHTML = '';
    let dayNotesField = document.getElementById('dayNotes');
    dayNotesField.value = day.notes;
    dayNotesField.rows = (day.notes.match(/\n/g) || []).length + 1;

    day.entries.forEach((entry) => {
        addRow(entry);
    });

    let pomoDisp = document.getElementById('pomodoroDisplay');
    let newPomoDisp = pomoDisp.cloneNode(true);
    pomoDisp.replaceWith(newPomoDisp);
    newPomoDisp.addEventListener('click', restartPomodoroTimer);
};

const setPomodoroTimer = (start, entryId) => {
    resetPomodoroTimer();
    if (!pomodoroTimeout && pomodoroOn && start) {
        
        const [message, delay, pomodoroType] = getPomodoroMessageAndDelay(start, +entryId);

        document.getElementById('pomodoroDisplay').innerText = message;
        if (delay < 0)
            return;

        pomodoroTimeout = setTimeout(() => {
            const context = new AudioContext();
            const oscillator = context.createOscillator();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(850, context.currentTime);

            const gain = context.createGain();
            oscillator.connect(gain);
            gain.connect(context.destination);

            
            const now = new Date;
            let time = timeFormat.format(now);
            const [nextMessage] = getPomodoroMessageAndDelay(time, +entryId + 1);
            showNotification(pomodoroType + ' done. ' + nextMessage);

            oscillator.start();

            gain.gain.setValueAtTime(1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2);

            oscillator.stop(context.currentTime + 2);
        }, [delay]);
    }
};

const showNotification = (message) => {
    if (!("Notification" in window))
        return;
    if (Notification.permission === 'granted') {
        new Notification(message);
    }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted')
                new Notification(message);
        });
    }
}

const updateDateByAmount = (amount) => {
    let datePieces = date.split('-');
    let changedDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2] + +amount);
    date = dateFormat.format(changedDate);
    document.getElementById('dateInput').value = date;
    setPageData(date);
    checkPageChanged();
};

let date = sessionStorage.getItem('date') || dateFormat.format(new Date);
let pomodoroOn = JSON.parse(localStorage.getItem('pomodoroOn')) || false;
let pomodoroTimeout;
document.getElementById('pomodoroInput').checked = pomodoroOn;
document.getElementById('pomodoroDisplay').hidden = !pomodoroOn;

const pomodoroTimesInput = document.getElementById('pomodoroTimesInput');
pomodoroTimesInput.value = getPomodoroTimes().join(',');
pomodoroTimesInput.hidden = !pomodoroOn;

document.getElementById('dateInput').value = date;
setPageData(date);

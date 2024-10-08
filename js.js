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
    const newEntryId = entries.length;
    const previousEntryId = newEntryId - 1;

    if (entries[previousEntryId]?.start === time)
        return;

    if (entries[newEntryId-1]) {
        const entryStop = entries[previousEntryId].stop;

        if (entryStop === '') 
            entries[previousEntryId].stop = time;
        else 
            time = entryStop;

        document.getElementById('row_' + previousEntryId).querySelector('.stop').value = time;
    }

    const newEntry = {
        id: newEntryId,
        start: time,
        stop: '',
        notes: ''
    };
    entries.push(newEntry);
    addRow(newEntry);
    
    saveEntries(entries, date);
    setPomodoroTimer(time, newEntryId);
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
    resetPomodoroTimer();
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

const addRow = ({id = -1, start = '', stop = '', notes = ''}) => {
    let rowTemplate = document.getElementById('rowTemplate');

    let newRow = rowTemplate.cloneNode(true);
    newRow.id = 'row_' + id;
    newRow.classList.add('row');
    document.getElementById('rows').appendChild(newRow);

    newRow.querySelector('.start').value = start;
    newRow.querySelector('.stop').value = stop;
    newRow.querySelector('.notes').value = notes;
    newRow.hidden = false;

    Array.from(newRow.getElementsByTagName('input')).map(input => {
        input.addEventListener('input', () => {
            checkPageChanged();
            if (input.classList.contains('start') && !document.getElementById('row_' + (+id + 1)))
                setPomodoroTimer(input.value, id);
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
            const entries = getPageData(date).entries.filter((entry) => entry.id !== id);
            saveEntries(entries, date);
            let latestEntry = entries[entries.length - 1];
            setPomodoroTimer(latestEntry?.start, latestEntry?.id);
        }
    });
};

const checkDayEqual = (day1, day2) => {
    let entries1 = day1.entries.sort((one, two) => (one.id < two.id) ? 1 : -1);
    let entries2 = day2.entries.sort((one, two) => (one.id < two.id) ? 1 : -1);

    return (JSON.stringify(entries1) === JSON.stringify(entries2)) && (day1.notes === day2.notes)
};

const checkDaysEqual = (days1, days2) => {
    let dates1 = Object.keys(days1);
    let dates2 = Object.keys(days2);

    if (JSON.stringify(dates1) !== JSON.stringify(dates2)) return false;

    return dates1.reduce((accumulator, date) => {
        // TODO: add day notes to file download/upload
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

const getEntriesToday = () => {
    return getDay(sessionStorage.getItem('date')).entries || [];
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

const getPomodoroMessageAndDelay = (start, entryId) => {
    const defaultPomodoroTimes = {
        work: 25,
        short: 5,
        long: 25,
    };

    let pomodoroTimes = JSON.parse(localStorage.getItem('pomodoroTimes')) || defaultPomodoroTimes;
    let pomodoroTime;
    let pomodoroType = "Work";
    if (Object.prototype.toString.call(pomodoroTimes) === '[object Array]') {
        // Putting a zero at the start of the pomodoroTimes array will switch the order of breaks and work periods.
        const pomoCount = (pomodoroTimes[0] === 0) ? 
            ++entryId % --pomodoroTimes.length :
            entryId % pomodoroTimes.length;

        if (pomoCount/2 !== Math.round(pomoCount/2)) {
            pomodoroType = "Break";
        }
        pomodoroTime = pomodoroTimes[pomoCount];
    }
    else {
        const pomoCount = entryId % 8;
        pomodoroTime = pomodoroTimes.work;
        if (pomoCount === 7) {
            pomodoroTime = pomodoroTimes.long;
            pomodoroType = "Break";
        }
        else if (pomoCount/2 !== Math.round(pomoCount/2)) {
            pomodoroTime = pomodoroTimes.short;
            pomodoroType = "Break";
        }
    }

    const nowMs = Date.now();
    const now = new Date;
    const lastStartTimeArr = start.split(':');
    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lastStartTimeArr[0], +lastStartTimeArr[1] + pomodoroTime);
    const delay = newDate - nowMs;

    const message = pomodoroType + " until " + displayTimeFormat.format(newDate);

    return [message, delay, pomodoroType];
}

const resetPomodoroTimer = () => {
    if (pomodoroTimeout) {
        clearTimeout(pomodoroTimeout);
        pomodoroTimeout = undefined;
        document.getElementById('pomodoroDisplay').innerText = "Click to activate pomodoro timer.";
    }
};

const saveEntries = (entries, date) => {
    let days = getDays();
    if (!days[date])
        days[date] = { "notes": "" };

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

    day.entries.map((entry) => {
        addRow(entry);
    });

    let pomoDisp = document.getElementById('pomodoroDisplay');
    let newPomoDisp = pomoDisp.cloneNode(true);
    pomoDisp.replaceWith(newPomoDisp);
    newPomoDisp.addEventListener('click', () => {
        let entries = getEntriesToday();
        let latestEntry = entries[entries.length - 1];
        setPomodoroTimer(latestEntry?.start, latestEntry?.id);
    });
};

const setPomodoroTimer = (start, entryId) => {
    resetPomodoroTimer();
    if (!pomodoroTimeout && pomodoroOn && start) {
        
        [message, delay, pomodoroType] = getPomodoroMessageAndDelay(start, +entryId);

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
            [nextMessage, unusedDelay, unusedType] = getPomodoroMessageAndDelay(time, +entryId + 1);
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

document.getElementById('dateInput').value = date;
setPageData(date);

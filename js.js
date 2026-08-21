'use strict';

document.getElementById('backDayButton').addEventListener('click', (e) => {
    if (checkPageChanged() || confirm("You have unsaved data that will be lost. Would you like to continue?"))
        updateDateByAmount(-1);
});

window.addEventListener('resize', (e) => {
    sizeAllNotesFields();
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
    markBreakRows();
    updateDayTotal();
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
            if (checkDate(fields[0])) {
                const datePieces = fields[0].split('-');
                const newDate = new Date(datePieces[0], datePieces[1] - 1, +datePieces[2]);
                if (!isNaN(newDate)) {
                    date = dateFormat.format(newDate);
                    newDays[date] = {
                        "entries": [],
                        "notes": parseFieldColumns(fields.slice(1)),
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

        // Settled into the stored shape first, so the comparison below is like for like.
        Object.keys(newDays).forEach(date => {
            newDays[date] = normalizeDay(newDays[date]);
        });

        let areRowsEqual = checkDaysEqual(newDays, getDays());

        // A file the timecard can read no day out of would put nothing in the place of everything.
        if (0 === Object.keys(newDays).length)
            alert('There are no days to upload in that file.');
        else if (areRowsEqual)
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
    markBreakRows();
    updateDayTotal();
    resetPomodoroTimer();
});

// The settings stay on screen while they are being set, so this toggles rather than hides on blur.
document.getElementById('settingsButton').addEventListener('click', (e) => {
    const settings = document.getElementById('settings');

    settings.hidden = !settings.hidden;
    if (settings.hidden)
        return;

    // Opened on whatever is actually in effect, so the fields never show a stale setting.
    showSettings();
    document.getElementById('pomodoroTimesInput').focus();
    document.getElementById('pomodoroTimesInput').select();
});

document.getElementById('pomodoroTimesInput').addEventListener('change', (e) => {
    const times = parsePomodoroTimes(e.target.value);

    if (times)
        localStorage.setItem('pomodoroTimes', JSON.stringify(times));

    // Unusable text is dropped, so the field always shows the times actually in effect.
    showSettings();
    markBreakRows();
    updateDayTotal();
    restartPomodoroTimer();
});

document.getElementById('pomodoroTimesInput').addEventListener('keydown', (e) => {
    if ('Enter' === e.key)
        e.target.blur();
});

document.getElementById('goalInput').addEventListener('change', (e) => {
    const goal = parseGoal(e.target.value);

    if (goal)
        localStorage.setItem('goal', JSON.stringify(goal));

    // Unusable text is dropped, so the field always shows the goal actually in effect.
    showSettings();
    refreshPomodoroDisplay();
});

document.getElementById('goalInput').addEventListener('keydown', (e) => {
    if ('Enter' === e.key)
        e.target.blur();
});

document.getElementById('fieldsInput').addEventListener('change', (e) => {
    const fields = parseFields(e.target.value);

    if (fields)
        localStorage.setItem('fields', JSON.stringify(fields));

    // Unusable text is dropped, so the field always shows the fields actually in effect.
    showSettings();

    // The fields are redrawn around what is already typed, and nothing is saved that was not asked to be.
    showFields(getPageData().notes);
    checkPageChanged();
});

document.getElementById('fieldsInput').addEventListener('keydown', (e) => {
    if ('Enter' === e.key)
        e.target.blur();
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

// A day's work is done once this much of it has been worked, until it is set to something else.
const defaultGoalMinutes = 8 * 60;

// Notes sit in titled fields laid out on a grid this many columns wide.
const fieldColumns = 12;
const defaultFieldTitle = 'Notes';

const addField = ({title, columns}, text) => {
    let fieldTemplate = document.getElementById('fieldTemplate');

    let newField = fieldTemplate.cloneNode(true);
    newField.removeAttribute('id');
    newField.classList.add('field');
    // The title is what ties a field to the text it holds, on the page and in the CSV alike.
    newField.dataset.title = title;
    newField.style.gridColumn = 'span ' + columns;
    document.getElementById('fields').appendChild(newField);

    newField.querySelector('.fieldTitle').innerText = title + ':';

    let notesField = newField.querySelector('.fieldNotes');
    notesField.value = text;
    newField.hidden = false;
    sizeNotesField(notesField);

    notesField.addEventListener('input', (e) => {
        checkPageChanged();
        sizeNotesField(e.target);
    });
};

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
    sizeNotesField(newRow.querySelector('.notes'));

    // Notes are a textarea, so the only inputs left in a row are the two times.
    Array.from(newRow.getElementsByTagName('input')).forEach(input => {
        input.addEventListener('input', () => {
            checkPageChanged();
            updateDayTotal();
            if (input.classList.contains('start') && newRow === getRowElements().pop())
                setPomodoroTimer(input.value, getRowIndex(newRow));
        })
        input.addEventListener('focus', e => {
            if ('' === e.target.value) {
                const now = new Date;
                e.target.value = timeFormat.format(now);
                checkPageChanged();
                updateDayTotal();
            }
        });
        input.addEventListener('keydown', e => {
            if ('Backspace' === e.key) {
                e.target.value = '';
                checkPageChanged();
                updateDayTotal();
            }
        });
    });

    newRow.querySelector('.notes').addEventListener('input', (e) => {
        checkPageChanged();
        sizeNotesField(e.target);
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
            markBreakRows();
            updateDayTotal();
            setPomodoroTimer(entries[entries.length - 1]?.start, entries.length - 1);
        }
    });
};

const buildCsv = (days) => {
    let csv = '\uFEFF';

    for (let date in days) {
        csv += csvRow([date].concat(buildFieldColumns(days[date].notes)));
        days[date].entries.forEach(entry => {
            csv += csvRow([entry.start, entry.stop, entry.notes]);
        });
    }

    return csv;
};

// Written back out as the field takes it, so the stored layout and the field agree.
const buildFieldsText = (fields) => {
    return fields.map(field => field.title + ':' + field.columns).join(', ');
};

// Every field in the layout gets a column so the days line up, and text a day holds outside the layout follows on.
const buildFieldColumns = (notes) => {
    let titles = getFields().map(field => field.title);

    Object.keys(notes).forEach(title => {
        if (!titles.includes(title))
            titles.push(title);
    });

    return titles.map(title => title + ': ' + (notes[title] || ''));
};

// Days are held by date, so text that is not one is not a day of the timecard.
const checkDate = (text) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(text);
};

const checkDayEqual = (day1, day2) => {
    return (JSON.stringify(day1.entries) === JSON.stringify(day2.entries)) && (JSON.stringify(day1.notes) === JSON.stringify(day2.notes))
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

// Minutes read as hours and minutes, so a day total looks like the times above it.
const formatMinutes = (minutes) => {
    return Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0');
};

const getDay = (date) => {
    return normalizeDay(getDays()[date]);
};

// Break rows are marked out by the pomodoro cycle, so anything not marked counts as worked.
const getDayTotals = () => {
    return getRowElements().reduce((totals, rowElement) => {
        const minutes = getEntryMinutes(rowElement);

        if (rowElement.classList.contains('break'))
            totals.breakMinutes += minutes;
        else
            totals.workedMinutes += minutes;

        return totals;
    }, {workedMinutes: 0, breakMinutes: 0});
};

// A day is what is held under a date, so anything else stored alongside them is not one and is passed over.
const getDays = () => {
    const storedDays = readStored('days');
    let days = {};

    if (storedDays instanceof Object) {
        Object.keys(storedDays).forEach(date => {
            if (checkDate(date))
                days[date] = normalizeDay(storedDays[date]);
        });
    }

    return days;
};

// A period is only counted once both of its ends are filled in.
const getEntryMinutes = (rowElement) => {
    const startPieces = rowElement.querySelector('.start').value.split(':');
    const stopPieces = rowElement.querySelector('.stop').value.split(':');

    if (startPieces.length < 2 || stopPieces.length < 2)
        return 0;

    const minutes = (+stopPieces[0] * 60 + +stopPieces[1]) - (+startPieces[0] * 60 + +startPieces[1]);

    return (0 < minutes) ? minutes : 0;
};

const getFieldElements = () => {
    return Array.from(document.getElementById('fields').children);
};

// The end of the day is where the goal is met, so it moves out while a break is taken and holds still while work is done.
const getEndOfDay = () => {
    const minutesLeft = getGoalMinutes() - getWorkedMinutes();
    const now = new Date;

    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + Math.max(0, minutesLeft));
};

const getGoalMinutes = () => {
    const storedGoal = readStored('goal');

    return (Number.isInteger(storedGoal) && 0 < storedGoal) ? storedGoal : defaultGoalMinutes;
};

// The layout is one setting shared by every day, so a field made once is there on all of them.
const getFields = () => {
    const storedFields = readStored('fields');

    if (Array.isArray(storedFields)) {
        const fields = parseFields(buildFieldsText(storedFields));
        if (fields)
            return fields;
    }

    return [{title: defaultFieldTitle, columns: fieldColumns}];
};

const getPageData = () => {
    let newEntries = getRowElements().map(rowElement => {
        return {
            start: rowElement.querySelector('.start').value,
            stop: rowElement.querySelector('.stop').value,
            notes: rowElement.querySelector('.notes').value,
        };
    });

    // Seeded from the day so text is never read off the page alone, then the fields say what it is now.
    let newNotes = getDay(date).notes;
    getFieldElements().forEach(fieldElement => {
        newNotes[fieldElement.dataset.title] = fieldElement.querySelector('.fieldNotes').value;
    });

    return {
        "entries": newEntries,
        "notes": normalizeNotes(newNotes),
    };
};

// Splits the configured times into the repeating cycle, and a test for which of its positions are breaks.
const getPomodoroCycle = () => {
    const pomodoroTimes = getPomodoroTimes();

    // A leading zero shifts the cycle so it starts on a break instead of a work period.
    const startsOnBreak = (pomodoroTimes[0] === 0);

    return {
        times: startsOnBreak ? pomodoroTimes.slice(1) : pomodoroTimes,
        isBreakAt: (index) => (((index % 2) === 1) !== startsOnBreak),
    };
};

const getPomodoroMessageAndDelay = (start, entryId) => {
    const cycle = getPomodoroCycle();

    const pomoCount = entryId % cycle.times.length;
    const pomodoroTime = cycle.times[pomoCount];
    const pomodoroType = cycle.isBreakAt(pomoCount) ? "Break" : "Work";

    const nowMs = Date.now();
    const now = new Date;
    const lastStartTimeArr = start.split(':');
    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lastStartTimeArr[0], +lastStartTimeArr[1] + pomodoroTime);
    const delay = newDate - nowMs;

    // The day ends where the goal is met, so what is left of the cycle has no say in it.
    const endOfDayNote = (getGoalMinutes() <= getWorkedMinutes()) ?
        "met" :
        displayTimeFormat.format(getEndOfDay());
    const message = pomodoroType + " until " + displayTimeFormat.format(newDate);

    return [message, delay, pomodoroType, endOfDayNote];
}

const getPomodoroTimes = () => {
    const storedTimes = readStored('pomodoroTimes');

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

// What the day total holds, plus the period in progress, which is being worked whether or not it has been stopped yet.
const getWorkedMinutes = () => {
    const rowElements = getRowElements();
    const openRow = rowElements[rowElements.length - 1];
    let worked = getDayTotals().workedMinutes;

    if (openRow && !openRow.classList.contains('break') && '' === openRow.querySelector('.stop').value) {
        const startPieces = openRow.querySelector('.start').value.split(':');

        if (1 < startPieces.length) {
            const now = new Date;
            const minutes = (now.getHours() * 60 + now.getMinutes()) - (+startPieces[0] * 60 + +startPieces[1]);

            if (0 < minutes)
                worked += minutes;
        }
    }

    return worked;
};

// Rows line up with the cycle one for one, so a row's position says whether it is a break.
const markBreakRows = () => {
    const cycle = getPomodoroCycle();

    getRowElements().forEach((rowElement, index) => {
        const isBreak = pomodoroOn && cycle.isBreakAt(index % cycle.times.length);
        rowElement.classList.toggle('break', isBreak);
    });
};

const normalizeDay = (day) => {
    const entries = day?.entries;

    return {
        "entries": (Array.isArray(entries) ? entries : []).map(normalizeEntry),
        "notes": normalizeNotes(day?.notes),
    };
};

// An entry is a start, a stop, and some text, so whatever is written in one is read as those or as nothing.
const normalizeEntry = (entry) => {
    const {start = '', stop = '', notes = ''} = (entry instanceof Object) ? entry : {};

    return {
        start: normalizeTime(start),
        stop: normalizeTime(stop),
        notes: normalizeText(notes),
    };
};

// Notes are held by field title. Empty fields are dropped and the titles are ordered, so two days compare as written.
const normalizeNotes = (notes) => {
    // Before there were fields a day's notes were one piece of text, which belongs in the default field.
    if (typeof notes === 'string')
        notes = {[defaultFieldTitle]: notes};

    // A list has no titles to hold text by, so it is no more notes than a number is.
    if (!(notes instanceof Object) || Array.isArray(notes))
        notes = {};

    let normalized = {};
    Object.keys(notes).sort().forEach(title => {
        const text = normalizeText(notes[title]);
        if ('' !== title.trim() && '' !== text)
            normalized[title] = text;
    });

    return normalized;
};

// A notes field shows text, so anything written where text should be is shown as nothing rather than as itself.
const normalizeText = (text) => {
    return ('string' === typeof text || 'number' === typeof text) ? String(text) : '';
};

// The time fields hold hours and minutes, so a time is read back into the shape they hold it in, and anything else is left empty.
const normalizeTime = (time) => {
    const pieces = String(time).trim().split(':');
    const limits = [23, 59, 59];

    if (pieces.length < 2 || limits.length < pieces.length)
        return '';
    if (pieces.some((piece, index) => !/^\d{1,2}$/.test(piece) || limits[index] < +piece))
        return '';

    return pieces.map(piece => piece.padStart(2, '0')).join(':');
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

// Reads hours and minutes, and returns null if it is not usable as a goal.
const parseGoal = (text) => {
    const pieces = text.split(':');

    if (2 !== pieces.length)
        return null;

    const hours = Number(pieces[0]);
    const minutes = Number(pieces[1]);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes))
        return null;
    if (hours < 0 || minutes < 0 || 59 < minutes)
        return null;

    const total = hours * 60 + minutes;

    return (0 < total) ? total : null;
};

// Reads a comma separated list of title:columns pairs, and returns null if it is not usable as a layout.
const parseFields = (text) => {
    let fields = [];

    for (const piece of text.split(',')) {
        if ('' === piece.trim())
            continue;

        const pieces = piece.split(':');
        if (2 < pieces.length)
            return null;

        const title = pieces[0].trim();
        // A field takes the full width unless it says otherwise.
        const columns = (pieces.length < 2 || '' === pieces[1].trim()) ? fieldColumns : Number(pieces[1]);

        // Two fields with one title would be one field holding one piece of text, so the title has to be its own.
        if ('' === title || fields.some(field => field.title === title))
            return null;
        if (!Number.isInteger(columns) || columns < 1 || fieldColumns < columns)
            return null;

        fields.push({title: title, columns: columns});
    }

    return (0 < fields.length) ? fields : null;
};

// Reads the "Title: text" columns that follow a date in the CSV.
const parseFieldColumns = (fields) => {
    let notes = {};

    fields.forEach(field => {
        const colon = field.indexOf(':');
        const title = (0 < colon) ? field.slice(0, colon) : '';

        // Notes written before the fields existed carry no title, so they land in the default field.
        if ('' === title.trim() || title.includes('\n'))
            notes[defaultFieldTitle] = field;
        else
            notes[title.trim()] = field.slice(colon + 1).replace(/^ /, '');
    });

    return notes;
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

// What is stored is only as good as what was last written into it, so text that will not read back is taken as nothing at all.
const readStored = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key));
    }
    catch (error) {
        return null;
    }
};

// The end of the day is read off the clock, so the display is written again as the clock moves under it.
const refreshPomodoroDisplay = () => {
    if (pomodoroOn && pomodoroTimeout) {
        const [message, delay, pomodoroType, endOfDayNote] = getPomodoroMessageAndDelay(pomodoroStart, pomodoroEntryId);

        showPomodoroMessage(message, endOfDayNote);
    }
};

const resetPomodoroTimer = () => {
    if (pomodoroTimeout) {
        clearTimeout(pomodoroTimeout);
        pomodoroTimeout = undefined;
        document.getElementById('pomodoroDisplay').innerText = "Click to activate pomodoro timer.";
    }
};

// A field the setting does not name is only on the page to hold text, so a save is when an empty one goes.
// Taken away one at a time rather than by redrawing them all, so saving does not move the cursor out of a field.
const removeEmptyFields = () => {
    const titles = getFields().map(field => field.title);

    getFieldElements().forEach(fieldElement => {
        if (!titles.includes(fieldElement.dataset.title) && '' === fieldElement.querySelector('.fieldNotes').value)
            fieldElement.remove();
    });
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
    removeEmptyFields();
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
    showFields(day.notes);

    day.entries.forEach((entry) => {
        addRow(entry);
    });

    markBreakRows();
    updateDayTotal();

    let pomoDisp = document.getElementById('pomodoroDisplay');
    let newPomoDisp = pomoDisp.cloneNode(true);
    pomoDisp.replaceWith(newPomoDisp);
    newPomoDisp.addEventListener('click', restartPomodoroTimer);
};

const setPomodoroTimer = (start, entryId) => {
    resetPomodoroTimer();
    if (!pomodoroTimeout && pomodoroOn && start) {
        // Kept so the display can be written again later without disturbing the timer already set.
        pomodoroStart = start;
        pomodoroEntryId = +entryId;

        
        const [message, delay, pomodoroType, endOfDayNote] = getPomodoroMessageAndDelay(start, +entryId);

        showPomodoroMessage(message, endOfDayNote);
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

// A notes field grows to fit what it holds, so nothing in it is hidden.
const sizeNotesField = (notesField) => {
    const style = getComputedStyle(notesField);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    // Held at one row, so the field is as tall as a single line and the text below can be measured against it.
    notesField.rows = 1;

    const lineHeight = notesField.clientHeight - padding;
    if (lineHeight <= 0)
        return;

    // Counted by the room the text takes rather than by its newlines, so a line that wraps counts every row it fills.
    notesField.rows = Math.max(1, Math.round((notesField.scrollHeight - padding) / lineHeight));
};

// A change of width moves where lines wrap, which changes the room every field needs.
const sizeAllNotesFields = () => {
    document.querySelectorAll('#rows .notes, #fields .fieldNotes').forEach(sizeNotesField);
};

// Every field shows the setting actually in effect, so unusable text typed into one leaves no trace.
const showSettings = () => {
    document.getElementById('pomodoroTimesInput').value = getPomodoroTimes().join(',');
    document.getElementById('goalInput').value = formatMinutes(getGoalMinutes());
    document.getElementById('fieldsInput').value = buildFieldsText(getFields());
};

// The layout says which fields are drawn, and the day says what goes in them.
const showFields = (notes) => {
    let fields = getFields();

    // Text the layout has no field for is drawn all the same, so a day's text is always somewhere it can be seen and saved.
    Object.keys(notes).forEach(title => {
        if (!fields.some(field => field.title === title))
            fields.push({title: title, columns: fieldColumns});
    });

    document.getElementById('fields').innerHTML = '';

    fields.forEach(field => {
        addField(field, notes[field.title] || '');
    });
};

// The end of the day is a lighter aside to the period in hand, so it is written as its own piece.
const showPomodoroMessage = (message, endOfDayNote) => {
    const display = document.getElementById('pomodoroDisplay');
    const note = document.createElement('span');

    note.className = 'endOfDay';
    note.innerText = ' - ' + endOfDayNote;

    display.innerText = message;
    display.appendChild(note);
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

const updateDayTotal = () => {
    const totals = getDayTotals();

    document.getElementById('workedTotal').innerText = formatMinutes(totals.workedMinutes);
    document.getElementById('breakTotal').innerText = formatMinutes(totals.breakMinutes);
};

// The fields setting was stored under noteBoxes before it was called fields, so an older one is carried over.
if (null === localStorage.getItem('fields') && null !== localStorage.getItem('noteBoxes')) {
    localStorage.setItem('fields', localStorage.getItem('noteBoxes'));
    localStorage.removeItem('noteBoxes');
}

const storedDate = sessionStorage.getItem('date');
let date = checkDate(storedDate) ? storedDate : dateFormat.format(new Date);
let pomodoroOn = (true === readStored('pomodoroOn'));
let pomodoroTimeout;
let pomodoroStart;
let pomodoroEntryId;

// The end of the day is worked out from the clock, so it is worked out again once a minute.
setInterval(refreshPomodoroDisplay, 60000);
document.getElementById('pomodoroInput').checked = pomodoroOn;
document.getElementById('pomodoroDisplay').hidden = !pomodoroOn;

showSettings();

document.getElementById('dateInput').value = date;
setPageData(date);

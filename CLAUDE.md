# Tiny Timecard

## Where work goes

Always push to `main`. Work may be committed on a branch first, but it is not
finished until it is on `main` -- do not leave it sitting on a branch waiting for
a pull request, and do not open one unless it is asked for.

## What the project is

Three files served as they are: `index.html`, `css.css`, `js.js`. No build step,
no third-party libraries, no package manager. Opening `index.html` is running it.

- The source files use CRLF line endings. Keep them, or the whole file reads as
  changed.
- All data lives in `localStorage` under `days`, plus the `fields`, `goal`,
  `pomodoroTimes`, and `pomodoroOn` settings. `sessionStorage` holds the date the
  tab is on, under `date`, and the day it was put on that date, under `dateSetOn`.
  A session outlives the day it began in, so the two together are what says whether
  the tab is on a day someone chose or one it has merely been left on.
- Stored data is read for what is usable in it and never trusted to be
  well formed. A day that cannot be read is passed over rather than thrown on.

## Checking a change

There are no tests in the repo. Drive the real page instead: serve the directory
and open it with Playwright, which is installed globally with Chromium at
`/opt/pw-browsers`.

    python3 -m http.server 8099 --directory .

Seed `localStorage`, load the page, and read the DOM back. Worth covering when
touching how data is read or written: a day that loads clean, adding a row,
saving and reloading, a CSV round trip, and malformed stored data of every shape.

## How it is written

Read a few commits before writing one. The code is plain and unabbreviated, and
comments say why a thing is the way it is rather than what the line does. Commit
messages are a sentence saying what the change does, then prose explaining what
was wrong and what now happens instead.

# Tiny Timecard

## Project Scope
This is a timecard is useful for time management. Activities can be documented throughout the day and notes can be entered at a day level to help plan the day.  
The time data can be exported and analyzed in a third party system, such as a spreadsheet or data analysis tool.

### Goals
- No third-party libraries
- Minimal install/setup
- Code is easy to read
- Easy to use
- Highly compatible across browsers

### Functionality
- Can add and remove rows for time period entry
- Can edit start, stop, and notes for each row
  - The notes field takes multiple lines, and grows to fit what is typed into it
- Notes for the day sit in titled boxes, laid out on a twelve column grid
  - The layout is set in the settings, as a comma separated list of `Title:columns` pairs, such as `Notes:12, Blockers:6, Wins:6`
  - A title on its own, such as `Notes`, takes the full twelve columns
  - The layout is one setting shared by every day, so a box made once is on all of them, empty until something is typed in it
  - Dropping a box from the layout only stops drawing it. Its text is kept, and putting the title back brings the text back
- Can export CSV of time, including day notes
  - The columns after the date hold the day's notes, one box each, written as `Title: text`
  - Boxes hold their column across every day, so the notes line up as columns in a spreadsheet
- Can modify CSV of time and import back into system
- Adding a new entry will perform the following:
  - If the previous stop time is empty, insert the current time as the stop time of the previous entry
  - insert the previous stop time as the start time of the new entry
- Ctrl + S will save the data to local storage and will not allow downloading the page as normal
- Shows a day total under the entries: time worked, then time on break in gray after a slash
  - A period is counted once both its start and stop are filled, so the period in progress joins the total when it is closed
  - Break periods are the ones marked by the pomodoro cycle, so with the timer off the whole day counts as worked
- Can change date and will show entries for that day
- Saves all data to `localStorage`, so cannot be used across devices
- The `...` button opens the settings, which hold the pomodoro cycle and the notes box layout
  - The button puts them away again, so they are only on screen while a setting is being changed
  - A setting takes effect as soon as its field is left or `Enter` is pressed, and unusable text is dropped
- With pomodoro timer enabled, will chime at the end of each work session and break
  - The cycle is set in the settings, as a comma separated list of minutes that alternates work and break, such as `45,5,40,5,35,5,30,30`
  - The cycle repeats from the start once its last period is done
  - Starting the list with a `0`, such as `0,5,45`, begins the cycle on a break instead of a work period
  - The timer display counts down how many work sessions are left in the cycle, so a cycle that covers a whole day shows the work left in the day
  - Break rows are shaded in the entry list, so work and break periods can be told apart at a glance

## Contact
Let me know if you have any feedback or suggestions via email: glasstacojar@gmail.com

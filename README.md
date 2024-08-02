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
- Can export CSV of time
- Can modify CSV of time and import back into system
- Adding a new entry will perform the following:
  - If the previous stop time is empty, insert the current time as the stop time of the previous entry
  - insert the previous stop time as the start time of the new entry
- Ctrl + S will save the data to local storage and will not allow downloading the page as normal
- Can change date and will show entries for that day
- Saves all data to `localStorage`, so cannot be used across devices
- With pomodoro timer enabled, will chime at the end of each work session and break

## Contact
Let me know if you have any feedback or suggestions via email: glasstacojar@gmail.com

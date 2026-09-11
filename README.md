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
- Notes for the day sit in titled fields, laid out on a twelve column grid
  - The `Fields` setting is a comma separated list of `Title:columns` pairs, such as `Notes:12, Blockers:6, Wins:6`
  - A title on its own, such as `Notes`, takes the full twelve columns
  - The setting is shared by every day, so a field made once is on all of them, empty until something is typed in it
  - A field holding text is on the page whether the setting names it or not, so changing the setting never puts text out of reach
  - A field the setting drops therefore goes only once it is empty, and renaming one leaves the old title on the page with its text
  - Saving is what clears an emptied field off the page, since a save is when its being empty becomes the truth
  - Emptying such a field takes it off the page on the next save, which is when it is empty for good
  - Nothing is written by changing the setting: text that has not been saved is still unsaved, and saving is what keeps it
- Can export CSV of time, including day notes
  - The columns after the date hold the day's notes, one field each, written as `Title: text`
  - Fields hold their column across every day, so the notes line up as columns in a spreadsheet
- Can modify CSV of time and import back into system
- Adding a new entry will perform the following:
  - If the previous stop time is empty, insert the current time as the stop time of the previous entry
  - insert the previous stop time as the start time of the new entry
- Ctrl + S will save the data to local storage and will not allow downloading the page as normal
- Leaving the page with unsaved data is asked about first, by refreshing or closing it as much as by changing the day
  - Refreshing and closing are asked about by the browser, in words of its own that a page cannot set
  - Changing the day is asked about by the timecard, in the same words, so the two read alike
- The `Goal` setting is how much worked time makes a day, as hours and minutes, such as `8:00`
  - The gray time on the timer display is when the goal will be met, worked out from the goal and the work done so far, so it says nothing about the pomodoro cycle
  - Only worked time counts towards it, so taking a break carries the end of the day out with it, and working holds it still
  - The period in progress counts towards the goal, whether or not it has been stopped yet
  - Once the goal is met that time reads `met` instead
- Shows a day total under the entries: time worked, then time on break in gray after a slash
  - A period is counted once both its start and stop are filled, so the period in progress joins the total when it is closed
  - Break periods are the ones marked by the pomodoro cycle, so with the timer off the whole day counts as worked
- The fields take only the room they are written in, up to half the page, and the entries take the rest
  - A field is as tall as what is written in it, so the fields are as tall as the writing in them and no taller
  - Each scrolls on its own once it holds more than its room, so neither pushes the other off screen
  - With the timer on, the fields stop short of the corner it sits in, rather than running under it
- Can change date and will show entries for that day
- Opens on the current day, and comes back to it once the day has turned
  - A day picked by hand is kept through a reload, so looking back at a past day stays there
  - A session outlives the day it began in, since a tab sits open and a browser brings its sessions back, so a tab holding a day nobody picked today is put on the current day
  - A tab left open through a day turn is put on the current day when it is come back to, as opening it fresh would be
  - The day is read off the clock once a minute, so a tab that is never touched -- on a second screen, or simply never clicked into -- comes up to the current day by itself
  - Unsaved work holds the tab on the day the work was written on, and the day catches up once it is saved
  - The current day is written in gray beside the date whenever the page is on another day, whether it is held there or a past day is being looked at on purpose
- Saving writes the day whole, from the page, so a save that would write over a change made somewhere else is asked about first
  - Another tab open on the same day is what makes that happen: it saves the day as it read it, which would take the work done since with it
  - Taking the asking up writes the page over the day as before, and turning it down leaves both the stored day and the page as they are
- Saves all data to `localStorage`, so cannot be used across devices
- Stored data that cannot be read is passed over, so the timecard always opens on what is left
  - A setting that will not read back falls through to its default, the same as unusable text typed into it does
  - A time that is not one is left empty, and text held under no title is dropped, so nothing malformed is shown as if it were data
  - What is dropped goes from storage on the next save, which is when the page is what the day holds
  - A CSV with no days in it is not uploaded, so a file picked by mistake cannot take the place of the data already there
- The `...` button opens the settings, which hold the pomodoro cycle and the notes box layout
  - The button puts them away again, so they are only on screen while a setting is being changed
  - A setting takes effect as soon as its field is left or `Enter` is pressed, and unusable text is dropped
- With pomodoro timer enabled, will chime at the end of each work session and break
  - The cycle is set in the settings, as a comma separated list of minutes that alternates work and break, such as `45,5,40,5,35,5,30,30`
  - The cycle repeats from the start once its last period is done
  - Starting the list with a `0`, such as `0,5,45`, begins the cycle on a break instead of a work period
  - The timer display shows when the current period is up, and after it in gray, when the day's goal will be met
  - Break rows are shaded in the entry list, so work and break periods can be told apart at a glance

## Ideas
- [Stacking the fields tightly](masonry.md), so a short field leaves no gap under it

## Contact
Let me know if you have any feedback or suggestions via email: glasstacojar@gmail.com

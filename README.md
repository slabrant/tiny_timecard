# tiny_timecard

## Project Scope
- I want a very small timecard that is highly compatible across browsers
- It should require minimal install/setup
- This is partially a training project, so I don't want to use any third-party libraries
- This timecard relies entirely on local storage
  - The data can be downloaded to a csv and stored in a separate system
- This is created around my workflow and does not have customization options
  - Ctrl + S will save the data to local storage and will not allow downloading the page as normal
  - Adding a new entry will insert the current time as the stop time of the previous entry
 
## Known issues
- The download can potentially have the dates in the wrong order
- Certain actions will not save the data from the page, such as navigating to a different day
- Need a delete confirmation alert
- It's difficult to read entry notes
- It's time-consuming to clear out a time input
- Date should be saved in session storage, not local storage
- Data should be able to be imported

## Contact
Let me know if you have any feedback or suggestions via email: glasstacojar@gmail.com

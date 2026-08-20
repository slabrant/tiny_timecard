# Stacking the fields tightly

Notes fields sit on a twelve column grid. A grid row is as tall as the tallest
field on it, so a short field leaves a gap beneath it and the next field has to
clear the whole row before it can start. Stacking them tightly closes that gap:
a field rises to sit directly under its own neighbour rather than under the row.

This was built and then taken back out, in `7c8371b` and its revert. It worked;
it is here for whenever the layout is worth the script again.

## Why it is not CSS

`grid-template-rows: masonry` does exactly this, and is only carried by Safari.
The project keeps to what works across browsers, so the placing has to be done
by the script or not at all.

## How it worked

`layoutFields()` replaces the grid. The fields are taken out of the flow
(`#fields` relative, `.field` absolute) and placed one at a time, in order:

1. Work out a track width from the container: `(clientWidth - 11 * gap) / 12`.
2. Give every field its width first, then size its notes field. How tall a
   field needs to be depends on how wide it is, so this cannot be done the
   other way round.
3. Keep an array of twelve numbers, how far down each column has been filled.
4. For each field, try every start column it could take. Its top at that start
   is the highest of the columns it would cover. Take the smallest top, and the
   leftmost start among ties, so the reading order still runs left to right.
5. Fill in only the columns the field sits over, so a field beside a tall one
   can still rise past it.
6. Give `#fields` the height of the fullest column, since the fields are out of
   the flow and the page gets no height from them.

A field's place is worked out from the fields before it, so growing a field
never moves that field, only the ones after it. That is what keeps it from
shifting under the cursor while it is being typed in.

## What has to call it

- `showFields()`, once the fields are on the page
- the notes field `input` handler, in place of `sizeNotesField`
- `removeEmptyFields()`, after taking any away
- `sizeAllNotesFields()`, which the window `resize` handler calls

`addField` carries the width on the element as `dataset.columns` rather than
setting `style.gridColumn`, and does not size its notes field, because the
layout does both.

## Worth testing

- No two fields overlap, at a wide and a narrow window
- A short field's neighbour starts above the bottom of the tall field beside it
- The container is tall enough that what follows it is not written over
- Typing into a field does not move that field, and does move the one below
- No field runs off the right edge

`masonry.js` in the scratchpad covered all of these.

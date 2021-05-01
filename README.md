# Notepad App

# To Do

- Add all standard markdown options. 
- Click on block -> 'un-render' markdown. 
- Figure out how to drag, drop, and resize images/media.
- Reassess if this makes sense as an editor for a notes app.

This is an in-progress markdown editor based on Draftjs. 

# Run Locally:

Clone this repo, then 

    npm i
    npm run start

# Functionality:

For now, I'm only focusing on the markdown element. Everything but that has been stripped away.  

Current markdown options (just for testing, will be changed) are:

    *something* 
    
    +++something+++

    -something-

# Add your own styles:

Go to 

    src/components/editor/styleMap.js

Add a style. It should be immediately useable whenever react is refreshed. 



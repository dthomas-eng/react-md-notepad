# Notepad App

# To Do

- Add all standard markdown options. 
- Click on block -> 'un-render' markdown. 
- Reassess if this makes sense as an editor for a notes app.

This is an in-progress markdown editor based on Draftjs. 

# Run Locally:

Clone this repo, then 

    npm i
    npm run start

# Functionality:

Markdown and drag and drop functionality are currently being developed side by side. 

Drag and Drop supports only images (for now).

Current markdown options:

    Inline: 

        **bold**, __bold__
        
        *italic*, _italic_

        ~~strikethrough~~

        `code`, ```code```

    Block: 

        # heading 

        <h2> Another heading

These styles can be added by selecting some text and using `cmd + b`, `cmd + i`, `cmd + shift + x`, and `cmd + ctrl + c`, respectively.

# Add your own styles:

For inline styles, go to 

    src/components/editor/styleMap.js

Add a style. It should be immediately useable whenever react is refreshed. 

For block styles, go to: 

    src/components/editor/blockStyles.js

And add a regex and length to a style class. 

Then, in App.css, define that style using the class name from blockStyles.js




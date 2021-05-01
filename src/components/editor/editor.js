import React, { Fragment } from "react";
import {
  Modifier,
  EditorState,
  convertToRaw,
  RichUtils,
  SelectionState
} from "draft-js";
import Editor from "draft-js-plugins-editor";

import styleMap from "./styleMap"

class PageContainer extends React.Component {

  //Inherits Component class and creates and empty state for our editor.
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      matchStrings: [],
      styles: [],
    };
  }

  componentDidMount = () => {
    this.setState({
      matchStrings: Object.values(styleMap).map((prop) => prop.regEx),
      styles: Object.keys(styleMap).map((prop) => prop),
    });
  };

  //Whevener anything changes, the state gets updated.
  onChange = editorState => {
    this.setState({
      editorState
    });
  };

  //Two key presses are listed for: 
  //Enter - when enter is pressed, the whole doc is scanned for our regexes and rendered.
  //Space - some styles we want to cancel after a space. That happens here too. 
  handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.renderEverything()
    }
    if (e.keyCode === 32) {
      this.clearStyles()
    }
  }

  //This method scans, block by block, for any matching regexes and replaces tag chars with style. 
  renderEverything = () => {
    //Get the current state and 'raw' JS version of the content in the editor.
    const contentState = this.state.editorState.getCurrentContent();
    const editorContentRaw = convertToRaw(contentState);
    let currentState = this.state.editorState;

    //Take a snapshot of current cursor location, we are about to fuck it up.
    const preEditSelection = currentState.getSelection();

    //This is the new state passed at the end into setstate. We operate on it a bunch then pass it back. 
    let newContentState = this.state.editorState.getCurrentContent()

    //We go through each block.
    for (let i = 0; i < editorContentRaw.blocks.length; i++) {

      //Get the block text and define what the match pattern should be: 
      const blockText = editorContentRaw.blocks[i].text

      //Get initial matches:
      let thereAreMatches = this.thereAreMatchesInThisBlock(blockText, this.state.matchStrings)

      while (thereAreMatches) {

        //Go through each of the match strings and look for a match. 
        for (let j = 0; j < this.state.matchStrings.length; j++) {

          let matchString = this.state.matchStrings[j]

          //Regex objects carry state. Need to reset the state of where to start looking back to index 0.
          matchString.lastIndex = 0

          //Get the next match
          let match = matchString.exec(convertToRaw(newContentState).blocks[i].text)

          if (match) {
            // Extract text content
            let textContent = match.groups.text;
             // currently is set up so match group 1 is always first half of symmetrical selector
            let tagContent = match[1];

            //Get start and end of the match. This is relative to the text block.
            let matchStart = match.index
            let matchEnd = match.index + match[0].length

            //Create a selection of the matching text. 
            let selection = new SelectionState({
              anchorKey: editorContentRaw.blocks[i].key,
              anchorOffset: matchStart,
              focusKey: editorContentRaw.blocks[i].key,
              focusOffset: matchEnd,
              hasFocus: false,
              isBackward: false
            });

            //This just generates a new state with our selected text. 
            newContentState = Modifier.replaceText(
              newContentState,
              selection,
              textContent
            );

            //We create a second selection as this needs to have a different offset because the string is now 
            //missing the tags. We need to account for that. 
            let removedTagsSelection = new SelectionState({
              anchorKey: editorContentRaw.blocks[i].key,
              anchorOffset: matchStart,
              focusKey: editorContentRaw.blocks[i].key,
              focusOffset: matchEnd - 2 * tagContent.length,
              hasFocus: false,
              isBackward: false
            });

            //Again, just adjusts the state with new inline styles.
            newContentState = Modifier.applyInlineStyle(
              newContentState,
              removedTagsSelection,
              this.state.styles[j]
            );

            //Check against blockText for more matches.
            thereAreMatches = this.thereAreMatchesInThisBlock(convertToRaw(newContentState).blocks[i].text, this.state.matchStrings)
          }
        }
      }

      //This stuff is what you'd call 'callback hell'. Because state updates asynchronously (and doesn't work with
      //promises), we need to chain these events so they happen in order. There must be a better way.
      this.setState({
        editorState: EditorState.push(currentState, newContentState, 'insert-characters')
      }, () => {

        this.setState({
          editorState: EditorState.push(currentState, newContentState, 'change-inline-style')
        }, () => {

          //Make new block where the cursor was before the replacement was made. 
          const editorState = this.state.editorState;
          const currentContent = editorState.getCurrentContent();
          const textWithEntity = Modifier.splitBlock(currentContent, preEditSelection);

          this.setState({
            editorState: EditorState.push(editorState, textWithEntity, "split-block")
          }, () => {

            //Set the style back to none. 
            this.clearStyles()

          });
        })
      }
      )
    }
  }

  //Reset Styles back to none. Have to set them one at a time. Really annoying thing about draftjs. 
  clearStyles = () => {

    Object.keys(styleMap).forEach((style) => {
      if (this.state.editorState.getCurrentInlineStyle().has(style)) {
        this.onChange(
          RichUtils.toggleInlineStyle(this.state.editorState, style)
        );
      }
    })

  }

  //Goes through list of matchStrings and sees if anything is left that matches (hasn't been rendered)
  thereAreMatchesInThisBlock = (blockText, matchStrings) => {

    let match
    let matchesArray = []

    for (let i = 0; i < this.state.matchStrings.length; i++) {

      let matchString = this.state.matchStrings[i]

      matchString.lastIndex = 0

      while ((match = matchString.exec(blockText)) != null) {
        matchesArray.push(match)
      }
    }

    if (matchesArray.length > 0) {
      return true
    } else {
      return false
    }
  }

  //This method turns a tab into 4 spaces. 
  handleTab = (e) => {
    e.preventDefault();

    let currentState = this.state.editorState;
    let newContentState = Modifier.replaceText(
      currentState.getCurrentContent(),
      currentState.getSelection(),
      "    "
    );

    this.setState({
      editorState: EditorState.push(currentState, newContentState, 'insert-characters')
    });
  }

  render() {
    return (
      <Fragment >
        {/* Maybe give it a tasty toolbar or logo in this padding above the editor?  */}
        <div className="editor" onKeyDown={this.handleKeyDown}>
          <Editor
            editorState={this.state.editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            onTab={this.handleTab}
            blockRendererFn={this.blockRenderer}
            blockStyleFn={this.myBlockStyleFn}
            customStyleMap={styleMap}
          />
        </div>
      </Fragment>
    );
  }
}

export default PageContainer;

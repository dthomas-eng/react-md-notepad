import React, { Fragment } from "react";
import {
  Modifier,
  EditorState,
  convertToRaw,
  RichUtils,
  SelectionState,
  AtomicBlockUtils
} from "draft-js";
import Editor from "draft-js-plugins-editor";

import styleMap from "./styleMap"
import blockStyles from "./blockStyles"

class PageContainer extends React.Component {

  //Inherits Component class and creates and empty state for our editor.
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      inlineMatchStrings: [],
      inlineStyles: [],
      blockMatchStrings: [],
      blockStyles: [],
      blockMatchLength: [],
      preEditSelection: null,
      FLAGS: {}
    };
  }

  componentDidMount = async () => {

    //Gets the flags object from flaginator-9000.
    let FLAGS
    const response = await fetch('https://dev.dthomas.io/fasteners/public/60a192c29663f02219720e2a');
    const flaginatorResponse = await response.json();
    if (flaginatorResponse.success === true) {
      FLAGS = flaginatorResponse.flags.reduce((o, curr) => ({ ...o, [curr.name]: curr.enable }), {})
    }

    this.setState({
      inlineMatchStrings: Object.values(styleMap).map((prop) => prop.regEx),
      inlineStyles: Object.keys(styleMap).map((prop) => prop),
      blockMatchStrings: Object.values(blockStyles).map((prop) => prop.regEx),
      blockStyles: Object.keys(blockStyles).map((prop) => prop),
      blockMatchLength: Object.values(blockStyles).map((prop) => prop.length),
      FLAGS
    });

    //Add listeners for dragging over and dropping in the editor area.
    let div = this.dropRef.current
    let editorDiv = document.getElementById('editor')
    editorDiv.addEventListener('dragover', this.handleDrag)
    div.addEventListener('drop', this.handleDrop)
  };

  //Whevener anything changes, the state gets updated.
  onChange = editorState => {
    this.setState({
      editorState
    });
  };

  //A ref that points to the editor area to make it droppable. Could (and probably should) just select this id.
  dropRef = React.createRef()

  /** Handler Methods **/

  //Two key presses are listed for: 
  //Enter - when enter is pressed, the whole doc is scanned for our regexes and rendered.
  //Space - cancels the inline style.
  handleKeyDown = async (e) => {
    e.persist()
    if (e.key === 'Enter') {
      await this.renderInlineStyles()
      await this.renderBlockStyles()
      await this.insertNewUnstyledBlock()
      this.clearStyles()

    }
    if (e.keyCode === 32) {
      this.clearStyles()
    }

    if (this.state.FLAGS.keyStyling === true) {

      // Styling
      if (e.ctrlKey === true && e.key === 'b') {
        e.preventDefault();
        this.surroundText('**'); // Bold
      }
      if (e.ctrlKey === true && e.key === 'i') {
        e.preventDefault();
        this.surroundText('*'); // italic
      }
      if (e.ctrlKey === true && e.shiftKey === true && e.key === 'X') {
        e.preventDefault();
        this.surroundText('~~'); // strikethrough
      }
      if (e.ctrlKey === true && e.shiftKey === true && e.key === 'C') {
        e.preventDefault();
        this.surroundText('`'); // code
      }
    }
  }

  /** Handler Methods **/

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

  //When anything is dragged over the editor, we turn on a text area that actually accepts the media. If something is
  //dropped directly into the draft editor, everything breaks.
  handleDrag = (e) => {

    document.getElementById("dropzone").style.width = `${document.getElementById("editor").offsetWidth}px`
    document.getElementById("dropzone").style.height = `${document.getElementById("editor").offsetHeight}px`;
    document.getElementById('dropzone').style.visibility = 'visible'

  }

  //When media is dropped into the editor area, this is called.
  handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()

    //Only allow 1 file to be dropped.
    if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {

      //And that file must be an image. Can detect different file types and treat accordingly.
      if (!e.dataTransfer.files[0].type.includes('image')) {
        alert('File type not supported (yet).')
        return
      }

      const sendToInsertBlock = (src) => this.insertBlock(src)
      let reader = new FileReader()
      reader.readAsDataURL(e.dataTransfer.files[0])

      reader.onloadend = function () {
        sendToInsertBlock(reader.result)
        //Need to hide the textArea that shows up when you hover to drop. It's done it's job at this point.
        document.getElementById('dropzone').style.visibility = 'hidden'
      }

    } else if (e.dataTransfer.files.length > 1) {
      alert('Only 1 file at a time (for now)')
    }
  }

  /** Block Markdown Parsing Methods */

  renderBlockStyles = async () => {

    //Get the current state and 'raw' JS version of the content in the editor.
    let currentState = this.state.editorState;

    //Take a snapshot of current cursor location, we are about to fuck it up.
    const preEditSelection = currentState.getSelection();

    //This is the new state passed at the end into setstate. We operate on it a bunch then pass it back. 
    let newContentState = this.state.editorState.getCurrentContent()

    newContentState.blockMap.forEach((block) => {

      this.state.blockMatchStrings.forEach((matchString, i) => {

        if (matchString.exec(block.text)) {

          console.log(matchString)
          console.log(this.state.blockStyles[i])
          //Create a selection of the matching text. 
          let selection = new SelectionState({
            anchorKey: block.key,
            anchorOffset: 0,
            focusKey: block.key,
            focusOffset: this.state.blockMatchLength[i], //Is there a better way to do this? 
            hasFocus: false,
            isBackward: false
          });

          newContentState = Modifier.replaceText(
            newContentState,
            selection,
            ''
          );

          //For each block that matches, set block type to that matching the key. 
          newContentState = Modifier.setBlockType(
            newContentState,
            selection,
            this.state.blockStyles[i]
          );

        }
      })

      this.setState({
        editorState: EditorState.push(currentState, newContentState, 'insert-characters'),
        preEditSelection
      }, () => {

        return
      })

    })
  }

  insertNewUnstyledBlock = async () => {

    //Make new block where the cursor was before the replacement was made. 
    let currentContent = this.state.editorState.getCurrentContent();
    const contentWithNewBlock = Modifier.splitBlock(currentContent, this.state.preEditSelection);

    this.setState({
      editorState: EditorState.push(this.state.editorState, contentWithNewBlock, "split-block")
    }, () => {

      //Set style for that block to unstyled - otherwise, last style will be carried over.
      currentContent = this.state.editorState.getCurrentContent();
      const selectionForChange = currentContent.getSelectionAfter()
      const unstyledBlockContent = Modifier.setBlockType(currentContent, selectionForChange, 'unstyled')

      this.setState({
        editorState: EditorState.push(this.state.editorState, unstyledBlockContent, "change-block-type")
      }, () => {
        return
      })
    })
  }

  //This function applies corresponding css class to each block by type. 
  //The css classes for this are found at the bottom of App.css.
  blockStyleFn = (contentBlock) => {
    return contentBlock.getType();
  }

  /** Inline Markdown Parsing Methods **/

  //This method scans, block by block, for any matching regexes and replaces tag chars with style. 
  renderInlineStyles = async () => {
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
      let thereAreMatches = this.thereAreMatchesInThisBlock(blockText, this.state.inlineMatchStrings)

      while (thereAreMatches) {

        //Go through each of the match strings and look for a match. 
        for (let j = 0; j < this.state.inlineMatchStrings.length; j++) {

          let matchString = this.state.inlineMatchStrings[j]

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
              this.state.inlineStyles[j]
            );

            //Check against blockText for more matches.
            thereAreMatches = this.thereAreMatchesInThisBlock(convertToRaw(newContentState).blocks[i].text, this.state.inlineMatchStrings)
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

          this.setState({ editorState: EditorState.forceSelection(this.state.editorState, preEditSelection) }, () => {
            //Set the style back to none. 
            return
          })
        })
      }
      )
    }
  }

  //Reset Styles back to none. Have to set them one at a time. Really annoying thing about draftjs.
  clearStyles = () => {

    this.state.inlineStyles.forEach((style) => {
      if (this.state.editorState.getCurrentInlineStyle().has(style)) {
        this.onChange(
          RichUtils.toggleInlineStyle(this.state.editorState, style)
        );
      }
    })

  }

  //Goes through list of inlineMatchStrings and sees if anything is left that matches (hasn't been rendered)
  thereAreMatchesInThisBlock = (blockText, inlineMatchStrings) => {

    let match
    let matchesArray = []

    for (let i = 0; i < this.state.inlineMatchStrings.length; i++) {

      let matchString = this.state.inlineMatchStrings[i]

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

  /** Media Drag/Drop Methods **/

  //Inserts a block when an image is dragged into the drag and drop zone.
  insertBlock = (source) => {

    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "MEDIA",
      "MUTABLE",
      { mediaSrc: source }
    );

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });

    this.setState({ ...this.state, imgsrc: source }, () => {

      this.setState({
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          " "
        )
      })
    })
  }

  //This is the method that renders each block. When we define custom blocks (like the ImageBlock below),
  //we can define what data goes where. In this case, we take the data from the contentstate (which is the imgsrc)
  //and put it into the props of the custom ImageBlock.
  //Could detect type of media (pdf, audio, video, ect...) and apply the same routine displaying them however we want.
  blockRenderer = contentBlock => {
    const type = contentBlock.getType();

    if (type === "atomic") {

      //get the data from that block:
      const { editorState } = this.state;
      const contentState = editorState.getCurrentContent();
      const data = contentState.getEntity(contentBlock.getEntityAt(0)).getData();

      return {
        component: this.ImageBlock,
        editable: true,
        props: {
          imgsrc: data.mediaSrc
        }
      };
    }
  };

  //The actual definition of the custom block.
  ImageBlock = props => {
    return (
      <div id={'imageLoc'}>
        <img src={props.blockProps.imgsrc} id={'imageBlock'} className="image-block" />
      </div>
    );
  };

  surroundText = (ends) => {
    const editorState = this.state.editorState;
    // get selection
    let selectionState = editorState.getSelection();
    const anchorKey = selectionState.getAnchorKey();
    let currentContent = editorState.getCurrentContent();
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const selectedText = currentContentBlock.getText().slice(start, end);
    currentContent = Modifier.replaceText(
      currentContent,
      selectionState,
      `${ends}${selectedText}${ends}`
    );

    this.setState({
      editorState: EditorState.push(editorState, currentContent, 'insert-characters')
    }, () => {
      // If nothing is selected, place cursor between the generated opening and closing tag
      if (selectedText === '') {
        const editorState = this.state.editorState;
        const currentContent = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();
        const focusKey = selectionState.getFocusKey();
        const offset = start + ends.length;
        const newSelectionState = selectionState.merge({
          focusKey: focusKey,
          focusOffset: offset,
          anchorOffset: offset,
        });
        const newEditorState = EditorState.forceSelection(editorState, newSelectionState);
        this.setState({
          editorState: EditorState.push(newEditorState, currentContent, 'insert-characters')
        });
      }
    });
  };

  render() {
    return (
      <Fragment >
        <textarea ref={this.dropRef} id='dropzone' />
        <div className='editor' id='editor' onKeyDown={this.handleKeyDown}>
          <Editor
            editorState={this.state.editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            onTab={this.handleTab}
            blockRendererFn={this.blockRenderer}
            blockStyleFn={this.blockStyleFn}
            customStyleMap={styleMap}
          />
        </div>
      </Fragment>
    );
  }
}

export default PageContainer;

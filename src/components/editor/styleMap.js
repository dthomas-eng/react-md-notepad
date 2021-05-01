const styleMap = {
    'bold': {
        fontWeight: 'bold',
        regEx: /\*{2}(?<text>.*?)\*{2}/g,
        keyCharsCount: 2 //This is the number of characters in the key, 1 for * and 2 for **
    },
    'italic': {
        fontStyle: 'italic',
        regEx: /\*(?<text>.*?)\*/g,
        keyCharsCount: 1
    },
    'strikethrough': {
        textDecoration: 'line-through',
        regEx: /~{2}(?<text>.*?)~{2}/g,
        keyCharsCount: 2
    },
};

export default styleMap;

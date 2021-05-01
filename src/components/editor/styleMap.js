const styleMap = {
    'bold': {
        fontWeight: 'bold',
        regEx: /\*{2}(?<text>.*?)\*{2}/g,
        keyCharsCount: 2 //This is the number of characters in the key, 1 for * and 2 for **
    },
    'strikethrough': {
        textDecoration: 'line-through',
        regEx: /~{2}(?<text>.*?)~{2}/g,
        keyCharsCount: 2
    },
    'MYSTYLE3': {
        color: 'red',
        regEx: /\+\+\+(?<text>.*?)\+\+\+/g,
        keyCharsCount: 3
    },
};

export default styleMap;

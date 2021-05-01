const styleMap = {
    'bold': {
        fontWeight: 'bold',
        regEx: /((\*{2})|(_{2}))(?<text>.+?)\1/g,
        keyCharsCount: 2 //This is the number of characters in the key, 1 for * and 2 for **
    },
    'italic': {
        fontStyle: 'italic',
        regEx: /(\*|_)(?<text>.+?)\1/g,
        keyCharsCount: 1
    },
    'strikethrough': {
        textDecoration: 'line-through',
        regEx: /(~{2})(?<text>.+?)\1/g,
        keyCharsCount: 2
    },
};

export default styleMap;

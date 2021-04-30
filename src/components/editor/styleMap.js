const styleMap = {
    'bold': {
        fontWeight: 'bold',
        regEx: /\*{2}(.*?)\*{2}/g,
        keyCharsCount: 2 //This is the number of characters in the key, 1 for * and 2 for **
    },
    'MYSTYLE2': {
        textDecoration: 'line-through',
        regEx: /\-(.*?)\-/g,
        keyCharsCount: 1
    },
    'MYSTYLE3': {
        color: 'red',
        regEx: /\+\+\+(.*?)\+\+\+/g,
        keyCharsCount: 3
    },
};

export default styleMap;

const codeStyles = {
    backgroundColor: '#eaeaea',
    fontFamily: 'monospace',
    padding: '0.08em 0.25em',
};

const styleMap = {
    'bold': {
        fontWeight: 'bold',
        regEx: /((\*{2})|(_{2}))(?<text>.+?)\1/g,
    },
    'italic': {
        fontStyle: 'italic',
        regEx: /(\*|_)(?<text>.+?)\1/g,
    },
    'strikethrough': {
        textDecoration: 'line-through',
        regEx: /(~{2})(?<text>.+?)\1/g,
    },
    'code': {
        ...codeStyles,
        regEx: /((`(?!`))|(`{3}))(?<text>.+?)\1/g,
    },
};

export default styleMap;

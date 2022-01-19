module.exports = {
	'env': {
		'browser': true
	},
	'plugins': [ 'prettier' ],
	'extends': ['prettier'],
	'parserOptions': {
		'ecmaVersion': 5
	},
	'rules': {
		"prettier/prettier": "error",
		'indent': [
			'error',
			'tab'
		],
		'array-bracket-spacing': [
			'error',
			'always'
		],
		'no-mixed-spaces-and-tabs': 'error',
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		],
		'space-in-parens': [
			'error',
			'always'
		],
		'space-before-function-paren': [
			'error',
			'always'
		],
		'multiline-ternary': [
			'error',
			'never'
		],
		'brace-style': 'error',
		'curly': 'error',
		'eqeqeq': [
			'error',
			'always'
		]
	}
};

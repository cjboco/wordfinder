/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals module, require, console */
const fs = require( 'fs' );
//const beautify = require( 'js-beautify' ).js_beautify;
const uglifyJS = require( "uglify-js" );
const dateFormat = require( 'dateformat' ); // https://www.npmjs.com/package/dateformat
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.

//http://blog.millermedeiros.com/node-js-as-a-build-script/

//https://eslint.org/docs/developer-guide/nodejs-api

const { ESLint } = require("eslint");

// bin scripts
const utils = require( './utilities' );

module.exports = {

	lint: function (srcPath, callback) {

		(async function main() {
			// 1. Create an instance with the `fix` option.
			const eslint = new ESLint({ fix: true });

			// 2. Lint files. This doesn't modify target files.
			const results = await eslint.lintFiles(srcPath);

			// 3. Modify the files with the fixed code.
			await ESLint.outputFixes(results);

			// 4. Format the results.
			//const formatter = await eslint.loadFormatter("stylish");
			//const resultText = formatter.format(results);

			// 5. Output it.
			log( 'JSHint: ' + srcPath.green );
			if ( typeof callback === 'function' ) {
				callback( null, srcPath );
			}

		})().catch((error) => {

			process.exitCode = 1;
			log(('JSHint:: Errors in file ').red + srcPath.white + '\n');

		});
	},

	pretty: function ( srcPath, destPath, callback ) {
		fs.readFile( srcPath, 'utf8', function ( err, data ) {
			if ( err ) throw err;
			// will this cause a file change loop?
			fs.writeFileSync( destPath, beautify( data.toString(), {
				braceStyle: 'collapse',
				breakChainedMethods: false,
				e4x: false,
				evalCode: false,
				indentChar: ' ',
				indentLevel: 0,
				indentSize: 4,
				indentWithTabs: true,
				jslintHappy: true,
				keepArrayIndentation: false,
				keepFunctionIndentation: false,
				maxPreserveNewlines: 10,
				preserveNewlines: true,
				spaceBeforeConditional: true,
				spaceInParen: false,
				unescapeStrings: false,
				wrapLineLength: 0,
				endWithNewline: true
			} ) );
			log( '  js-pretty: ' + srcPath.green );
		} );
	},

	uglify: function ( srcPath, destPath, callback ) {

		fs.readFile( './package.json', 'utf8', function ( err, data ) {

			if ( err ) {
				throw err;
			}

			var now = new Date();
			var pkg = JSON.parse( data.toString() );
			var banner = `/*!\r * ${pkg.name} - v${pkg.version}\r` +
				` * © ${dateFormat(now, 'yyyy')} ${pkg.author}\r` +
				` * This file generated ${dateFormat(now, 'dddd, mmmm dS, yyyy')}\r */\r`;
			var destFix = destPath.replace( 'website/', '' ).replace( 'mylibs-src', 'mylibs' ).replace( 'dev/', '' ).replace( 'dist/', '' ).replace( './', '' );

			fs.readFile( srcPath, 'utf8', function ( err, jsFile ) {

				if ( err ) {
					throw err;
				}

				var code = {};

				code[ utils.get_file_from_path( destPath ) ] = jsFile;

				var result = uglifyJS.minify( code, {

					sourceMap: {
						includeSources: false, // this is because we can't point back to the uncompressed file... i think.
						url: '/' + destFix + '.map',
						filename: utils.get_file_from_path( destPath )
					}

				} );

				if ( result.error ) throw result.error;

				//log(result);
				fs.writeFileSync( destPath, banner + result.code );
				fs.writeFileSync( destPath + '.map', result.map );

				log( 'js-uglify: ' + destPath.green );

				if ( typeof callback === 'function' ) {

					callback( null, {
						src: srcPath,
						dest: destPath
					} );

				}

			} );

		} );

	}

};

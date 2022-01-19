/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals module, require, console */
const fs = require( 'fs' );
const jshint = require( 'jshint' ).JSHINT;
const beautify = require( 'js-beautify' ).js_beautify;
const uglifyJS = require( "uglify-js" );
const dateFormat = require( 'dateformat' ); // https://www.npmjs.com/package/dateformat
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.

//http://blog.millermedeiros.com/node-js-as-a-build-script/

// bin scripts
const utils = require('./utilities');

const buildOptions = {
	css_minify: true,
	js_minify: true,
	image_minify: true,
	html_minify: true,
	ftp: false,
	srcDir: 'src/',
	distDir: 'dist/'
};

module.exports = {

	lint: function ( srcPath, callback ) {
		fs.readFile( srcPath, 'utf8', function ( err, data ) {
			if ( err ) throw err;
			if ( jshint( data.toString(), {
					curly: true,
					eqeqeq: true,
					eqnull: true,
					browser: true,
					globals: {
						jQuery: true
					},
				} ) ) {
				log( 'JSHint: ' + srcPath.green );
				if ( typeof callback === 'function' ) {
					callback( null, srcPath );
				}
			} else {
				log( ( 'JSHint:: Errors in file ' ).red + srcPath.white + '\n' );

				var out = jshint.data(),
					errors = out.errors;

				for ( var j = 0; j < errors.length; j++ ) {
					log( errors[ j ].line + ':' + errors[ j ].character + ' -> ' + errors[ j ].reason + ' -> ' + errors[ j ].evidence );
				}

			}

		} );
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
			var destFix = destPath.replace( 'website/', '' ).replace( 'mylibs-src', 'mylibs' ).replace( buildOptions.srcDir, '' ).replace( buildOptions.distDir, '' ).replace( './', '' );

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

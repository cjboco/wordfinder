/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals require, console, process */
const fse = require( 'fs-extra' );
const globby = require( 'globby' );
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console );

// bin scripts
const utils = require( './utilities' );

// ex: yarn build no-js-minify no-css-minify no-html-minify
var buildOptions = {
	css_minify: true,
	js_minify: true,
	image_minify: true,
	html_minify: true,
	ftp: false
};

const handler = require( './handler' )( buildOptions );

const dir = './dist';

// remove everything from the dist folder, then handle build
fse.remove( dir, function () {

	// now create the folder
	fse.ensureDir( dir )
		.then( () => {

			// turn on FTP
			if ( buildOptions.ftp ) {
				handler.openSync();
			}

			globby( [ './dev/**/*', '!.DS_Store' ], {

				expandDirectories: true

			} ).then( paths => {

				paths.forEach( ( path ) => {
					//path = path.replace('./dev/', '/dev/');
					switch ( utils.get_ext( path ) ) {
					case 'sass':
					case 'scss':
						return handler.handleSCSS( path, 'added', buildOptions );
						break;
					case 'js':
						return handler.handleJS( path, 'added', buildOptions );
						break;
					case 'gif':
					case 'jpg':
					case 'jpeg':
					case 'png':
					case 'svg':
						return handler.handleImages( path, 'added', buildOptions );
						break;
					case 'htm':
					case 'html':
					case 'xml':
						return handler.handleHTML( path, 'added', buildOptions );
						break;
					case 'cfm':
					case 'cfc':
						return handler.handleCF( path, 'added', buildOptions );
						break;
					default:

						// we don't want to copy directories
						if ( !fse.lstatSync( path ).isDirectory() ) {
							return handler.handleUndefined( path, 'added', buildOptions );
						}

						break;

					}

				} );

			} ).catch( err => {

				log.error( err );

			} );

		} )
		.catch( err => {

			log.error( err );

		} );
} );

// we can pass some options:
// $: yarn build no-js-minify no-css-minify no-html-minify
process.argv.forEach( function ( val, index, array ) {

	if ( index > 1 && val === 'no-minify' ) {

		buildOptions.js_minify = false;
		buildOptions.html_minify = false;
		buildOptions.image_minify = false;
		buildOptions.css_minify = false;

	} else {

		if ( index > 1 && val === 'no-js-minify' ) {
			buildOptions.js_minify = false;
		}

		if ( index > 1 && val === 'no-html-minify' ) {
			buildOptions.html_minify = false;
		}

		if ( index > 1 && val === 'no-image-minify' ) {
			buildOptions.image_minify = false;
		}

		if ( index > 1 && val === 'no-css-minify' ) {
			buildOptions.css_minify = false;
		}

		if ( index > 1 && val === 'ftp' ) {
			buildOptions.ftp = false;
		}

	}

} );

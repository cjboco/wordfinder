/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals require,process */
const chokidar = require( 'chokidar' );
const dateFormat = require( 'dateformat' ); // https://www.npmjs.com/package/dateformat
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.
const fse = require( 'fs-extra' );

// bin scripts
const utils = require( './utilities' );

const buildOptions = {
	css_minify: true,
	js_minify: true,
	image_minify: true,
	html_minify: true,
	ftp: false
};

const handler = require( './handler' )( buildOptions );

// Initialize watcher.
var watcher = chokidar.watch( [ 'dev/' ], {
	persistent: true,
	ignored: [ '.*' ],
	ignoreInitial: true,
	followSymlinks: true,
	cwd: '.',
	usePolling: true,
	interval: 100,
	binaryInterval: 300,
	alwaysStat: false,
	depth: 99,
	awaitWriteFinish: {
		stabilityThreshold: 2000,
		pollInterval: 100
	},
	ignorePermissionErrors: false,
	atomic: true
} );

var watcherSync = chokidar.watch( [ 'dist/' ], {
	persistent: true,
	ignored: [ '.*' ],
	ignoreInitial: true,
	followSymlinks: true,
	cwd: '.',
	usePolling: true,
	interval: 100,
	binaryInterval: 300,
	alwaysStat: false,
	depth: 99,
	awaitWriteFinish: {
		stabilityThreshold: 2000,
		pollInterval: 100
	},
	ignorePermissionErrors: false,
	atomic: true
} );

// used for FTP uploading
var fileBuffer = [];
const maxFiles = 5;
const ftproot = 'wwwroot/';


// Add event listeners.
watcher
	.on( 'add', path => {

		var fileExt = utils.get_ext( path );

		switch ( fileExt ) {
		case 'sass':
		case 'scss':
			handler.handleSCSS( path, 'added', buildOptions );
			break;
		case 'js':
			handler.handleJS( path, 'added', buildOptions );
			break;
		case 'gif':
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'svg':
			handler.handleImages( path, 'added', buildOptions );
			break;
		case 'htm':
		case 'html':
		case 'xml':
			handler.handleHTML( path, 'added', buildOptions );
			break;
		case 'cfm':
		case 'cfc':
			handler.handleCF( path, 'added', buildOptions );
			break;
		default:
			// we don't want to copy directories
			if ( !fse.lstatSync( path ).isDirectory() ) {
				handler.handleUndefined( path, 'added', buildOptions );
			}
			break;
		}

	} )
	.on( 'change', path => {

		var now = new Date(),
			fileExt = utils.get_ext( path );

		switch ( fileExt ) {
		case 'sass':
		case 'scss':
			handler.handleSCSS( path, 'changed', buildOptions );
			break;
		case 'js':
			handler.handleJS( path, 'changed', buildOptions );
			break;
			// image files can be minified
		case 'gif':
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'svg':
			handler.handleImages( path, 'changed', buildOptions );
			break;
			// html files can be minified
		case 'htm':
		case 'html':
		case 'xml':
			handler.handleHTML( path, 'changed', buildOptions );
			break;
		case 'cfm':
		case 'cfc':
			handler.handleCF( path, 'changed', buildOptions );
			break;
		default:
			// we don't want to copy directories
			if ( !fse.lstatSync( path ).isDirectory() ) {
				handler.handleUndefined( path, 'changed', buildOptions );
			}
			break;
		}

	} )
	.on( 'unlink', path => {

		var now = new Date(),
			destPath = path.replace( 'dev/', 'dist/' );

		fse.remove( destPath, err => {

			if ( err ) {
				throw err;
			}

			log( ( '\nFile ' + destPath.red + ' has been removed (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' ) );

		} );

	} );

// More possible events.
watcher
	.on( 'addDir', path => {

		var now = new Date(),
			destPath = path.replace( 'dev/', 'dist/' );

		fse.ensureDir( destPath, err => {

			if ( err ) {
				throw err;
			}

			log( ( '\nDirectory ' + destPath.green + ' has been added (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' ) );

		} );

	} )
	.on( 'unlinkDir', path => {

		var now = new Date(),
			destPath = path.replace( 'dev/', 'dist/' );

		fse.remove( destPath, err => {

			if ( err ) {
				throw err;
			}

			log( ( '\nDirectory ' + destPath.red + ' has been removed (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' ) );

		} );

	} )
	.on( 'error', error => {

		log( ( '\nWatcher error: ' + error ).red );

	} )
	/*.on('raw', (event, path, details) => {
		'use strict';
		log('Raw event info:', event, path, details);
	})*/
	.on( 'ready', () => {

		log( ( '\nInitial scan of ' + ( 'dev/' ).yellow + ' complete.' ).bold + ( ' Ready for changes' ).green );

	} );

// Let's watch the dist folder to sync FTP, SSH, or Whatever...
watcherSync
	.on( 'add', path => {

		// only FTP if specified and not an invisible file
		var fileName = utils.get_file_from_path( path );

		if ( buildOptions.ftp && fileName.indexOf( '.ds_store' ) < 0 ) {

			var destPath = path.replace( 'dist/', ftproot );

			fileBuffer.push( {
				srcPath: path,
				destPath: destPath
			} );

			handler.handleSync( fileBuffer, 'add', maxFiles );
		}

	} )
	.on( 'change', path => {

		// only FTP if specified and not an invisible file
		var fileName = utils.get_file_from_path( path );

		if ( buildOptions.ftp && fileName.indexOf( '.ds_store' ) < 0 ) {

			var destPath = path.replace( 'dist/', ftproot );

			fileBuffer.push( {
				srcPath: path,
				destPath: destPath
			} );

			handler.handleSync( fileBuffer, 'change', maxFiles );
		}

	} )
	/*.on('raw', (event, path, details) => {

		log('Raw event info:', event, path, details);

	})*/
	.on( 'ready', () => {

		if ( buildOptions.ftp ) {
			handler.openSync();
		}

		log( ( buildOptions.ftp ? 'FTP: ' + ( 'ON' ).bold.green : 'FTP: ' + ( 'OFF' ).bold.red ) + ( '\n\nInitial scan of ' + ( 'dist/' ).yellow + ' complete.' ).bold + ( ' Ready for changes' ).green );

	} );

// Get list of actual paths being watched on the filesystem
//var watchedPaths = watcher.getWatched();

// Un-watch some files.
//watcher.unwatch('new-file*');

//https://github.com/paulmillr/chokidar

// we can pass some options:
// $: npm run watch no-html-minify no-css-minify
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
			buildOptions.ftp = true;
		}

	}

} );

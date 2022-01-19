/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals require,console */
//const path = require('path'); // https://nodejs.org/docs/latest/api/path.html
const dateFormat = require( 'dateformat' ); // https://www.npmjs.com/package/dateformat
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.
const fse = require( 'fs-extra' );

// bin scripts
const utils = require( './utilities' );
const sass = require( './sass' );
const scripts = require( './scripts' );
const html = require( './html' );
const images = require( './image' );
const sync = require( './ftp' );

var buildOptions = {
	css_minify: true,
	js_minify: true,
	image_minify: true,
	html_minify: true,
	ftp: false
};

module.exports = function ( opts ) {

	var module = {};

	buildOptions = opts || buildOptions;

	module.handleSCSS = function ( srcPath, type ) {

		var now = new Date(),
			dirPath = srcPath.match( /(.*)[\/\\]/ )[ 1 ] || '',
			fileName = utils.get_file_from_path( srcPath ),
			fileExt = utils.get_ext( srcPath ),
			ignoreRE = new RegExp( '^_[.]*' ), // don't conver files that start with '_'
			destPath = srcPath.replace( 'dev/', 'dist/' ).replace( 'scss/', 'css/' ).replace( '.scss', '.css' );

		// let's make sure our dieectory exists
		utils.checkDirPath( destPath, ( err ) => {

			if ( err ) {
				throw err;
			}

			log( ( '\n> ' + fileExt.toUpperCase() ).cyan + ' file has been ' + type + ' (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' );

			// if we update a '_import' file, we just need to SASS the main.scss file.
			if ( ignoreRE.test( fileName ) ) {

				srcPath = dirPath + '/main.scss';
				destPath = srcPath.replace( 'dev/', 'dist/' ).replace( 'scss/', 'css/' ).replace( '.scss', '.css' );

			}

			sass.convertSass( srcPath, destPath, buildOptions.css_minify, function ( err, result ) {

				var myFiles = result || [];

				if ( err ) {
					throw err;
				}

				log( 'Copying CSS file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green );

				myFiles.forEach( function ( aFile ) {

					// we don't care about the .map file
					if ( aFile.search( '.map' ) < 0 ) {

						sass.autoPrefix( aFile, aFile, function ( err, result ) {

							if ( err ) {
								throw err;
							}

							log( 'Post prefix: ' + aFile.green );

						} );

					} else {

						destPath = aFile.replace( 'dist/', '' );

					}

				} );

			} );

		} );

	};

	module.handleJS = function ( srcPath, type ) {

		var now = new Date(),
			fileExt = utils.get_ext( srcPath ),
			destPath = srcPath.replace( 'dev/', 'dist/' );

		// let's make sure our dieectory exists
		utils.checkDirPath( destPath, ( err ) => {

			if ( err ) {
				throw err;
			}

			log( ( '\n> ' + fileExt.toUpperCase() ).cyan + ' file has been ' + type + ' (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' );

			// we only want to lint and uglify files in "mylibs"
			if ( srcPath.indexOf( 'mylibs/' ) > -1 ) {

				scripts.lint( srcPath, function ( err, result ) {

					if ( err ) {
						throw err;
					}

					if ( buildOptions.js_minify ) {

						scripts.uglify( srcPath, destPath, function ( err, result ) {

							if ( err ) {
								throw err;
							}

							log( 'Copying and minifying JS file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green );

						} );

					} else {

						fse.copy( srcPath, destPath ).then( () => log( 'Copying JS' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green ) ).catch( err => console.error( err ) );

					}

				} );

			} else {

				// this is not one of my scripts, just copy
				fse.copy( srcPath, destPath ).then( () => log( 'Copying JS' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green ) ).catch( err => console.error( err ) );

			}

		} );
	};

	module.handleImages = function ( srcPath, type, opts ) {

		var now = new Date(),
			fileExt = utils.get_ext( srcPath ),
			destPath;

		destPath = srcPath.replace( 'dev/', 'dist/' );

		// let's make sure our dieectory exists
		utils.checkDirPath( destPath, ( err ) => {

			if ( err ) {
				throw err;
			}

			log( ( '\n> ' + fileExt.toUpperCase() ).cyan + ' file has been ' + type + ' (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' );
			log( 'Copying IMAGE file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green );

			images.minify( srcPath, destPath, opts, function ( err, result ) {

				if ( err ) {
					throw err;
				}

			} );

		} );
	};

	module.handleHTML = function ( srcPath, type ) {

		var now = new Date(),
			fileExt = utils.get_ext( srcPath ),
			destPath = srcPath.replace( 'dev/', 'dist/' );

		// let's make sure our dieectory exists
		utils.checkDirPath( destPath, ( err ) => {

			if ( err ) {
				throw err;
			}

			log( ( '\n> ' + fileExt.toUpperCase() ).cyan + ' file has been ' + type + ' (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' );

			if ( buildOptions.html_minify ) {

				html.minify( srcPath, destPath, function ( err, result ) {

					if ( err ) {
						throw err;
					}

					log( 'Copying and minifying HTML file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green );

				} );

			} else {

				fse.copy( srcPath, destPath ).then( () => log( 'Copying HTML file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green ) ).catch( err => console.error( err ) );

			}

		} );

	};

	module.handleCF = function ( srcPath, type ) {

		var now = new Date(),
			fileExt = utils.get_ext( srcPath ),
			destPath = srcPath.replace( 'dev/', 'dist/' );

		// let's make sure our dieectory exists
		utils.checkDirPath( destPath, ( err ) => {

			if ( err ) {
				throw err;
			}

			log( ( '\n> ' + fileExt.toUpperCase() ).cyan + ' file has been ' + type + ' (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' );

			fse.copy( srcPath, destPath ).then( () => log( 'Copying COLDFUSION file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green ) ).catch( err => console.error( err ) );

		} );
	};

	module.handleUndefined = function ( srcPath, type ) {

		var now = new Date(),
			fileExt = utils.get_ext( srcPath ),
			fileName = utils.get_file_from_path( srcPath ),
			destPath = srcPath.replace( 'dev/', 'dist/' );

		if ( fileName.indexOf( '.ds_store' ) < 0 ) {

			// let's make sure our dieectory exists
			utils.checkDirPath( destPath, ( err ) => {

				if ( err ) {
					throw err;
				}

				log( ( '\n> ' + fileExt.toUpperCase() ).cyan + ' file has been ' + type + ' (' + dateFormat( now, 'dddd, mmmm dS, yyyy, h:MM:ss TT Z' ) + ')' );

				fse.copy( srcPath, destPath ).then( () => log( 'Copying file:' + ( '\nsrc: ' ).bold + srcPath.green + ( '\ndest: ' ).bold + destPath.green ) ).catch( err => console.error( err ) );

			} );

		}

	};

	module.openSync = function () {

		sync.connect();

	};

	module.closeSync = function () {

		sync.close();

	};

	module.handleSync = function ( buffer, type, max ) {

		var srcBuffer = buffer.splice( 0, max );

		sync.upload( srcBuffer, null, function ( err, result ) {

			if ( err ) {
				throw err;
			}

			log( 'Pushed file via FTP:' + ( '\nsrc: ' ).bold + ( result.src ).cyan + ( '\ndest: ' ).bold + ( result.dest ).cyan );

			if ( buffer.length ) {
				module.handleSync( buffer, type, max );
			}

		} );

	};

	return module;
};

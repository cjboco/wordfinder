/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals module,require,console */

const fse = require( 'fs-extra' );
const path = require( 'path' );
const Client = require( 'ftp' );
const colors = require( 'colors' ); // jshint ignore:line
const prompt = require('prompt');
const log = console.log.bind( console ); // Something to use when events are received.

/*

	1-14-2020

	We should really update to another FTP package

	Maybe: https://www.npmjs.com/package/basic-ftp

*/

// bin scripts
const utils = require( './utilities' );

// SOME UTILITY FUNCTIONS
function verifyExists( fullPath ) {

	return fse.existsSync( fullPath ) ? fullPath : null;

}

function findRecursive( dir, fileName ) {

	var fullPath = path.join( dir, fileName );
	var nextDir = path.dirname( dir );
	var result = verifyExists( fullPath );

	if ( !result && ( nextDir !== dir ) ) {
		result = findRecursive( nextDir, fileName );
	}

	return result;

}

// this module: npm install ftp --save-dev
var ftp;
var ftp_config = verifyExists( '.ftpjsrc' );
var ftp_settings = {};

try {

	if (!ftp_config) {
		console.error( ('You must have a .ftpsrc file located in the root of your project.').bold.red );
	} else {
		var cfg = findRecursive( process.cwd(), '.ftpjsrc' );
		ftp_settings = fse.readFileSync( cfg, 'utf8' );
		ftp_settings = JSON.parse( ftp_settings );
	}

} catch ( ex ) {

	console.error( ex );

}

if ( ftp_config && typeof ftp_settings === 'object' && ftp_settings.host && ftp_settings.user && ftp_settings.password && ftp_settings.keepalive ) {

	module.exports = {

		connect: function () {

			ftp = new Client();

			ftp.connect( {
				//debug: console.log,
				host: ftp_settings.host,
				//port: 21,
				user: ftp_settings.user,
				password: ftp_settings.password,
				//connTimeout: 10000,
				//pasvTimeout: 10000,
				keepalive: ftp_settings.keepalive
			} );

		},

		close: function () {

			ftp.end();

		},

		checkDir: function ( dir, callback ) {

			// we can be passed '/', which is a root.
			// we don't need to create a directory for that.

			// should already be connected.
			ftp.mkdir( dir, true, function ( err, result ) {

				if ( err ) {
					callback( err );
				}

				callback( null );

			} );

		},

		upload: function ( buffer, destPath, callback ) {

			if ( typeof buffer === 'String' ) {

				buffer = [
					{
						srcPath: buffer,
						destPath: destPath
					}
				];

			}

			for ( var i = 0; i < buffer.length; i++ ) {

				var aFile = buffer[ i ];
				var dir = utils.get_dir_from_path( aFile.destPath );

				if ( aFile.srcPath && aFile.destPath && dir.length ) {

					module.exports.checkDir( dir, ( err ) => {

						if ( err ) {
							callback( err );
						}

						if (verifyExists(aFile.destPath)) {

							prompt.start();

							prompt.get([{
								name: 'yesno',
								validator: '/^(y|n)[a-zA-Z]*/',
								warning: 'Please answer with Yes or No (y/n).'
							}], function (err, result) {
								if (err) { return callback(err); }
								console.log('File already exists. Would you like to overwrite? (yes/no):');
								if (result.yesno.toLowerCase().subString(0, 1) === 'y') {
									// delete the file
									delete( aFile.destPath, callback )
								} else {
									callback('Error: Cannot upload a file when that file already exists.');
								}
							});

						}


						ftp.put( aFile.srcPath, aFile.destPath, ( err ) => {

							if ( err ) {

								callback( err );

							} else {

								callback( null, {
									src: aFile.srcPath,
									dest: aFile.destPath
								} );

							}

						} );

					} );

				} else {

					callback( Error( 'Invalid directory.' ) );

				}
			}

		},

		rename: function ( buffer, destPath, callback ) {},

		delete: function (buffer, destPath, callback) {

			ftp.put( aFile.destPath, ( err ) => {

				if ( err ) {

					callback( err );

				} else {

					callback( null, {
						src: '',
						dest: aFile.destPath
					} );

				}

			} );

		}

	};

} else {

	callback( Error( 'Invalid FTP configuration.' ) );

}

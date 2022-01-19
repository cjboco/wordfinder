/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals module,require,console */
const sass = require( 'sass' );
const autoprefixer = require( 'autoprefixer' );
const postcss = require( 'postcss' );
const fs = require( 'fs' );
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.

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

	autoPrefix: function ( srcPath, destPath, callback ) {

		fs.readFile( srcPath, 'utf8', function ( err, data ) {

			if ( err ) throw err;
			if ( data.toString() ) {

				postcss( [ autoprefixer ] )
					.process( data.toString(), {
						from: srcPath
					} )
					.then( function ( result ) {

						result.warnings().forEach( function ( warn ) {
							log( ( 'Prefix err: ' + warn.toString() ).red + '\n' + ( 'file: ' ).red + srcPath.white + '\n' );
						} );

						//log(result.css);

						fs.writeFile( destPath, result.css, function ( err ) {

							var myFiles = [];

							if ( !err ) {

								myFiles.push( destPath );

								if ( typeof callback === 'function' ) {
									callback( null, myFiles );
								}

							} else {

								log( ( 'Prefix err: ' + err ).red + '\n' + ( 'file: ' ).red + destPath.white + '\n' );

							}

						} );

					} );
			}
		} );
	},

	convertSass: function ( srcPath, destPath, minify, callback ) {

		sass.render( {

			file: srcPath,
			outFile: destPath,
			sourceMap: destPath.replace( buildOptions.distDir, '' ) + '.map',
			outputStyle: !minify ? 'expanded' : 'compressed'

		}, function ( error, result ) {

			if ( error ) {

				log( ( 'sass-err:' ).red + ' message ' + error.message );
				log( ( 'sass-err:' ).red + ' column ' + error.column + ' line ' + error.line );
				log( ( 'sass-err:' ).red + ' status ' + error.status );
				log( ( 'sass-err:' ).red + ' file ' + error.file + '\n' );

			} else {

				var myFiles = [];

				fs.writeFile( destPath, result.css, function ( err ) {

					if ( !err ) {

						myFiles.push( destPath );

						fs.writeFile( destPath + '.map', result.map, function ( err ) {

							if ( !err ) {

								log( 'Conversion time: ' + srcPath.green + ( ' (' + result.stats.duration + 'ms)' ).cyan );

								myFiles.push( destPath + '.map' );

								if ( typeof callback === 'function' ) {
									callback( null, myFiles );
								}

							} else {

								log( ( 'Conversion err: ' + err ).red + '\n' + ( 'file: ' ).red + destPath.white + '\n' );

							}

						} );

					} else {

						log( ( 'Conversion err: ' + err ).red + '\n' + ( 'file: ' ).red + destPath.white + '\n' );

					}

				} );

			}

		} );

	}

};

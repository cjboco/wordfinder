/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals module, require, console */
const fs = require( 'fs' );
const minify = require( 'html-minifier' ).minify;
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.

//http://blog.millermedeiros.com/node-js-as-a-build-script/

module.exports = {

	minify: function ( srcPath, destPath, callback ) {

		fs.readFile( srcPath, 'utf8', function ( err, htmlFile ) {

			if ( err ) {
				throw err;
			}

			var result = minify( htmlFile, {
				collapseWhitespace: true,
				conservativeCollapse: true,
				html5: true,
				removeComments: true
			} );

			if ( result.error ) {
				throw result.error;
			}

			fs.writeFileSync( destPath, result );

			log( 'Minify HTML: ' + destPath.green );

			if ( typeof callback === 'function' ) {

				callback( null, {
					src: srcPath,
					dest: destPath
				} );

			}

		} );

	}

};

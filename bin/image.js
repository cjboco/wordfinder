/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals module, require  */
const imagemin = require( 'imagemin' );
const imageminJpegtran = require( 'imagemin-jpegtran' );
const imageminPngquant = require( 'imagemin-pngquant' );
const imageminSvgo = require( 'imagemin-svgo' );
const imageminGifsicle = require( 'imagemin-gifsicle' );
const colors = require( 'colors' ); // jshint ignore:line
const log = console.log.bind( console ); // Something to use when events are received.

// bin scripts
const utils = require( './utilities' );

// image min plugin:
// https://www.npmjs.com/package/imagemin

module.exports = {

	minify: function ( srcPath, destPath, opts, callback ) {

		imagemin( [ srcPath ], {

			destination: utils.get_dir_from_path( destPath ),

			plugins: [
				imageminJpegtran(),
				imageminPngquant(),
				imageminSvgo(),
				imageminGifsicle()
			]

		} ).then( files => {

			//console.log( files );
			//=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …]

			log( ( opts.image_minify ? 'Minify' : 'Copying' ) + ' IMAGE file: ' + destPath.green );

			if ( typeof callback === 'function' ) {

				callback( null, {
					src: srcPath,
					dest: destPath
				} );
			}

		} ).catch( ( error ) => {

			log( 'There was a problem with IMAGE minification.', error );

		} );

	}

};

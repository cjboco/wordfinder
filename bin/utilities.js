/*jshint strict:implied, esversion:6, curly:false, unused:false */
/*globals require */
const fse = require( 'fs-extra' );

module.exports = {

	get_ext: function ( srcPath ) {
		var ret = '';
		var i = srcPath.lastIndexOf( '.' );
		if ( -1 !== i && i <= srcPath.length && srcPath.lastIndexOf( '.' ) > 0 ) {
			ret = srcPath.substr( i + 1 );
		}
		return ret.toLowerCase();
	},

	get_file_from_path: function ( srcPath ) {
		var ret = '';
		var i = srcPath.lastIndexOf( '/' );
		if ( -1 !== i && i <= srcPath.length ) {
			ret = srcPath.substr( i + 1 );
		}
		return ret.toLowerCase();
	},

	get_dir_from_path: function ( srcPath ) {
		var m = srcPath.match( /(.*)[\/\\]/ );
		return m[ 1 ] || ( m[ 0 ] === '/' ? '/' : '' );
	},

	checkDirPath: function ( srcPath, cb ) {
		// https://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist/21196961#21196961
		var destPath;
		if ( !srcPath || !srcPath.length ) {
			cb.call( null );
		}
		destPath = module.exports.get_dir_from_path( srcPath );
		fse.ensureDir( destPath, ( err ) => {
			if ( err ) {
				if ( err.code == 'EEXIST' )
					cb.call( null ); // ignore the error if the folder already exists
				else
					cb.call( err ); // something else went wrong
			} else {
				// successfully created folder - Um, this was being called, even if it didn't create the directory.
				//log('checkDirPath created directory: ' + (destPath).yellow.bold);
				cb.call( null );
			}
		} );
	}

};

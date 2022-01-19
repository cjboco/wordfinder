/* eslint-disable strict */
module.exports = function ( grunt ) {

	// Project configuration.
	grunt.initConfig( {
		'pkg': grunt.file.readJSON( 'package.json' ),
		'jshint': {
			'all': [
				'Gruntfile.js',
				'src/**/*.js'
			]
		},
		'uglify': {
			'options': {
				'banner': '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			'build': {
				'src': 'src/assets/js/script.js',
				'dest': 'dist/assets/js/script.js'
			}
		},
		'watch': {
			'scripts': {
				'files': ['**/*.js'],
				'tasks': ['jshint'],
				'options': {
					'spawn': false
				}
			}
		}
	} );

	// Load the plugins.
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	// Default task(s).
	grunt.registerTask( 'default', ['uglify'] );

};

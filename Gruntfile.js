'use strict';

var SERVER_PORT = 9000;

// # Globbing

module.exports = function(grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // configurable paths
    var dchatConfig = {
        app: 'app',
        dist: 'dist',
        originalScriptTag: '<script src="scripts/main.js"></script>',
        tmpScriptTag: '<script src="scripts/.build.js"></script>'
    };

    grunt.initConfig({
        dchat: dchatConfig,
        pkg: grunt.file.readJSON('bower.json'),
        banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',

        clean: {
            dev: ['.sass-cache', '.tmp', '<%= dchat.app %>/.css'],
            dist: ['.sass-cache', '.tmp', '<%= dchat.app %>/.css',
                '<%= dchat.dist %>/scripts', '<%= dchat.dist %>/styles', '<%= dchat.dist %>/vendor'
            ],
            tmpBuild: ['<%= dchat.app %>/scripts/.build.js'],
            tails: ['<%= dchat.dist %>/_index.html']
        },

        sass: {
            dist: {
                files: {
                    '<%= dchat.app %>/.css/main.css': '<%= dchat.app %>/styles/main.scss'
                }
            }
        },

        handlebars: {
            compile: {
                options: {
                    namespace: 'JST',
                    amd: true
                },
                files: {
                    '.tmp/scripts/templates.js': ['<%= dchat.app %>/scripts/templates/*.hbs']
                }
            }
        },

        bower: {
            all: {
                rjsConfig: '<%= dchat.app %>/scripts/main.js',
                options: {
                    exclude: ['jquery', 'modernizr', 'requirejs']
                }
            }
        },

        requirejs: {
            dist: {
                options: {
                    baseUrl: '<%= dchat.app %>/scripts',
                    mainConfigFile: "<%= dchat.app %>/scripts/main.js",
                    name: 'main',
                    optimize: 'none',
                    out: "<%= dchat.app %>/scripts/.build.js",

                    paths: {
                        'templates': '.tmp/scripts/templates'
                    },

                    almond: false,
                    preserveLicenseComments: false
                }
            }
        },

        watch: {
            options: {
                spawn: false
            },
            css: {
                files: ['<%= dchat.app %>/styles/{,*/}*.scss'],
                tasks: ['sass']
            },
            handlebars: {
                files: [
                    '<%= dchat.app %>/scripts/templates/*.hbs'
                ],
                tasks: ['handlebars']
            },
            // js: {
            //     files: [
            //         '<%= dchat.app %>/scripts/*.js', 
            //         '<%= dchat.app %>/scripts/**/*.js'
            //     ],
            //     tasks: ['build_js']
            // },
            html: {
                files: [
                    '<%= dchat.app %>/index.html'
                ],
                tasks: ['htmlmin']
            }
        },

        useminPrepare: {
            html: '<%= dchat.app %>/index.html',
            options: {
                dest: '<%= dchat.dist %>'
            }
        },

        cssmin: {
            options: {
                banner: '<%= banner %>'
            }
        },

        uglify: {
            options: {
                banner: '<%= banner %>'
            }
        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= dchat.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,svg,gif,ico}',
                    dest: '<%= dchat.dist %>/images'
                }]
            }
        },

        htmlmin: {
            dist: {
                files: {
                    '<%= dchat.dist %>/_index.html': '<%= dchat.app %>/index.html'
                }
            },
            min: {
                options: {
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true
                },
                files: {
                    '<%= dchat.dist %>/index.html': '<%= dchat.dist %>/_index.html',
                    '<%= dchat.dist %>/404.html': '<%= dchat.app %>/404.html'
                }
            }
        },

        rev: {
            dist: {
                files: {
                    src: [
                        '<%= dchat.dist %>/scripts/{,*/}*.js',
                        '<%= dchat.dist %>/styles/{,*/}*.css',
                        '<%= dchat.dist %>/vendor/{,*/}*.js',
                    ]
                }
            }
        },

        usemin: {
            html: ['<%= dchat.dist %>/{,*/}*.html'],
            options: {
                dirs: ['<%= dchat.dist %>']
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= dchat.app %>',
                    src: [
                        '*.{ico,png}',
                        'audio/{,*/}*.*'
                    ],
                    dest: '<%= dchat.dist %>'
                }]
            }
        },

        connect: {
            options: {
                protocol: 'http',
                port: grunt.option('port') || SERVER_PORT,
                open: true,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            dev: {
                options: {
                    base: [
                        '.tmp',
                        '<%= dchat.app %>'
                    ]
                }
            },
            dist: {
                options: {
                    protocol: 'http',
                    base: '<%= dchat.dist %>'
                }
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= dchat.app %>/scripts/{,*/}*.js',
                '!<%= dchat.app %>/vendor/*'
            ]
        },

        includereplace: {
            prod: {
                options: {
                    globals: {
                        appId: '55869',
                        authKey: 'tpH4TbFKOcmrYet',
                        authSecret: 'Tctz5xEDNWuJQq4',
                        debugQM: '0',
                        debugQB: '0'
                    }
                },
                src: '<%= dchat.app %>/configs/environment.js',
                dest: '<%= dchat.app %>/configs/main_config.js'
            },
            dev: {
                options: {
                    globals: {
                        appId: '36125',
                        authKey: 'gOGVNO4L9cBwkPE',
                        authSecret: 'JdqsMHCjHVYkVxV',
                        debugQM: '1',
                        debugQB: '1'
                    }
                },
                src: '<%= dchat.app %>/configs/environment.js',
                dest: '<%= dchat.app %>/configs/main_config.js'
            },
            local: {
                src: '<%= dchat.app %>/config.js',
                dest: '<%= dchat.app %>/configs/main_config.js'
            }
        }
    });

    var envTarget = grunt.option('env') || 'local';

    grunt.registerTask('createDefaultTemplate', function() {
        grunt.file.write('.tmp/scripts/templates.js', 'this.JST = this.JST || {};');
    });

    grunt.registerTask('createTmpScriptTag', function(rollBack) {
        var path = dchatConfig.app + '/index.html';
        var indexFile = grunt.file.read(path);
        if (typeof rollBack === 'undefined') {
            grunt.file.write(path, indexFile.replace(dchatConfig.originalScriptTag, dchatConfig.tmpScriptTag));
        } else {
            grunt.file.write(path, indexFile.replace(dchatConfig.tmpScriptTag, dchatConfig.originalScriptTag));
            grunt.task.run(['clean:tmpBuild']);
        }
    });

    grunt.registerTask('server', function(target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve' + (target ? ':' + target : '')]);
    });

    grunt.registerTask('serve', function(target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        /***********************************************************************
         1) task - "grunt serve"
         > use configs from ../q-municate-web./app/config.js

         2) task - "grunt serve --env=dev"
         > use configs from ../q-municate-web./app/configs/environments.js and set DEV environment

         3) task - "grunt serve --env=prod"
         > use configs from ../q-municate-web./app/configs/environments.js and set PROD environment
         ***********************************************************************/
        grunt.task.run([
            'includereplace:' + envTarget,
            'clean:dev',
            'sass',
            'createDefaultTemplate',
            'handlebars',
            'connect:dev',
            'watch'
        ]);
    });

    /***************************************************************************
     1) task - "grunt build"
     > use configs from ../q-municate-web./app/config.js

     2) task - "grunt build --env=dev"
     > use configs from ../q-municate-web./app/configs/environments.js and set DEV environment

     3) task - "grunt build --env=prod"
     > use configs from ../q-municate-web./app/configs/environments.js and set PROD environment
     ***************************************************************************/
    grunt.registerTask('build', [
        'jshint',
        'includereplace:' + envTarget,
        'clean:dist',
        'sass',
        'createDefaultTemplate',
        'handlebars',
        'requirejs',
        'createTmpScriptTag',
        'useminPrepare',
        'concat',
        'cssmin',
        'uglify',
        'newer:imagemin',
        'htmlmin',
        'rev',
        'usemin',
        'newer:copy',
        'createTmpScriptTag:rollBack',
        'htmlmin:min',
        'clean:tails'
    ]);

    grunt.registerTask('build_js', [
        'includereplace:' + envTarget,
        'requirejs',
        'createTmpScriptTag',
        'useminPrepare',
        'concat',
        'newer:imagemin',
        'rev',
        'newer:copy',
        'createTmpScriptTag:rollBack',
    ]);

    grunt.registerTask('default', ['build']);
    grunt.registerTask('test', ['jshint']);

};

module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        responsive_images: {
            dev: {
                options: {
                    engine: 'im',
                    sizes: [
                        {
                            width: 1600,
                            name: 'large',
                            suffix: "-2x",
                            quality: 80
                        },
                        {
                          width: 800,
                          name: "large",
                          quality: 60
                        },
                        {
                          width: 460,
                          name: "medium",
                          quality: 60
                        }
                    ]
                },

                files: [{
                    expand: true,
                    src:['*.{gif,jpg,png}'],
                    cwd: 'img_src/',
                    dest: 'img/'
                }]
            }
        },

        clean: {
            dev: {
                src: ['img'],
            },
        },

        copy: {
            dev: {
                files: [{
                    expand: true,
                    src: 'img_src/fixed/*.{gif,jpg,png}',
                    dest: 'img/'
                }]
            },
        },


    });


    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    // Default task
    grunt.registerTask('default', ['clean', 'copy', 'responsive_images']);
}

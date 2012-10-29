var fs = require('fs');
var exec = require('child_process').exec,
  child;
var passthru = require('passthru');

exports.description = "CakePHP: A fresh CakePHP 2 install with best practices.";
exports.notes = "Sets up a fresh CakePHP 2 install with best practices";

exports.warnOn = "*";

function _randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

exports.template = function(grunt, init, done) {

  var _ = grunt.utils._;

  _.extend(grunt.helper("prompt_for_obj"), {
    name: {
      message: "Project Name",
      // validator: /^[\w\-\.]+$/
    }
  });

  grunt.helper("prompt", {}, [

    // Get the name of the project.
    grunt.helper("prompt_for", "name")

  ], function(err, props) {
    // Files to copy (and process).
    var files = init.filesToCopy(props);


    // Remove any git files
    _.each(files, function(flag, file) {
      if (file.indexOf(".git") === 0) {
        delete files[file];
      }
    });


    // Ensure the name is lowercase.
    // props.name = props.name.toLowerCase();

    // Set the module name to be the title case.
    props.project_name = props.name; //[0].toUpperCase() + props.name.slice(1);
    
    props.security_salt = _randomString(40);
    props.security_seed = _randomString(30, '0123456789');

    // Actually copy (and process) files.
    init.copyAndProcess(files, props, {
      noProcess: [ "lib/**", "favicon.ico", "app/composer.phar" ]
    });

    fs.chmodSync('cake', '777');
    fs.chmodSync('app/tmp/cache/models', '777');
    fs.chmodSync('app/tmp/cache/persistent', '777');
    fs.chmodSync('app/tmp/cache/views', '777');
    fs.chmodSync('app/tmp/logs', '777');
    fs.chmodSync('app/tmp/sessions', '777');
    fs.chmodSync('app/tmp/tests', '777');
    fs.chmodSync('app/webroot/uploads', '777');

    var ignore_stream = fs.createWriteStream(".gitignore");
      ignore_stream.once('open', function(fd) {
      ignore_stream.write(".DS_Store\n");
      ignore_stream.write("app/tmp/*\n");
      ignore_stream.write("app/Config/Environment/local.php\n");
      ignore_stream.write("");
    });

    passthru("php app/composer.phar install --working-dir app", function() {
      passthru("lessc app/webroot/less/bootstrap/bootstrap.less app/webroot/css/bootstrap.css", function() {

        exec("git init && git add . && git commit -m 'Intitial commit'");

        fileData = "<?php\n";
        fileData += "\n";
        fileData += "$config['debug'] = 2;\n";
        fileData += "\n";
        fileData += "$config['App.database'] = array(\n";
        fileData += "\t'host'       => 'localhost',\n";
        fileData += "\t'login'      => '',\n";
        fileData += "\t'password'   => '',\n";
        fileData += "\t'database'   => '',\n";
        fileData += ");\n";
        
        fs.writeFile("app/Config/Environment/local.php", fileData, function() {
          done();
        });

      });
      
    });
    
});

};

#![Kelper](http://git.ctco.lv/raw/~alexander.domotenko/training/builder.git/master/resources/icon.png) Kelper 0.1.0

Kelper is a project builder 

##Installation

This plugin requires Grunt 0.4.5 or newer.

If you haven't used Grunt before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a Gruntfile as well as install and use Grunt plugins. 

Kelper can be installed with these methods:

```
npm install git+https://git.ctco.lv/r/~alexander.domotenko/training/builder.git --save
```

or add as dependency to package.json file.

```
module.exports = function (grunt) {
    grunt.loadNpmTasks('kelper');
};
```

Once the plugin has been installed, your Gruntfile should look like this:

```
grunt.loadNpmTasks('kelper');
```

##Configuration

To make plugin working you should create config folder in root of project directory.

There should be these folders:

* **build** (optional)
* **target**

### Build configuration

There can be 3 files that is used to setup builder configuration on each process that should be written as grunt export plugin. There files should contain Javascript and return JSON with pre-defined values. These values are parsed and used in builder.
If there is no files or configuration is not rewrited then default configuration will be taken.

Processes:

* **Compile** (compile.js) - Used to compile typescript
* **Optimization** (optimization.js) - Used to run RequireJS
* **Finalization** (finalization.js) - Used to minify, copy and hash files

By default all 3 tasks will be runned. To change this parameter **-process** or **-p** parameter should be used.

There are available these commands:

* **c** or **compile** - only compile process will be run
* **o** or **optimization** - will run compile and optimization task
* **f** or **finalization** - will run all 3 tasks

*Example of usage:*

```
grunt -process optimization
```

#### Compile

Compile process is used to compile TypeScript.
There are 3 main parameters:

* **source** - path of folder from base directory that should be compiled
* **target** - path of folder from base directory that collects compiled files
* **version** - compiled javascript standart

*Example*:

```
module.exports = function(grunt){
    return {
        source: 'src',
        target: 'target/compiled',
        version: 'es5'
    };
};
```

#### Optimization

Optimization process is used to optimize RequireJS, generate libraries and compile them
There are 3 main parameters:

* **remoteBaseUrl** - xxxxxxxxxxx
* **source** - path of folder from base directory that should be optimized
* **target** - path of folder from base directory that collects optimized files

*Optimization file example*:

```
module.exports = function(grunt){
    return {
        remoteBaseUrl: 'src',
        source: 'target/compiled',
        target: 'target/optimized'
    };
};
```

#### Finalization

Finalization process is used to minify, copying static resources and hash files.
There are 3 main parameters:

* **resourcePath** - resource folder path from base directory
* **source** - path of folder from base directory that should be finalized
* **target** - path of folder from base directory that collects finalized files

*Finalization file example*:

```
module.exports = function(grunt){
    return {
        resourcePath: 'resources',
        source: 'target/optimized',
        target: 'target/finalized'
    };
};
```


### Environment (Target) configuration

Environment configuration is used for builder to get project build information. All information should be in **JSON** format. Default file is **"local.json"**, but if you need use another one, Kelper should be runned with additional parameter **"-target"** or **"-t"**.

*Example:*

```
grunt -target dev
```

Environment configuration should contain **JSON** format data and all data is optional.

By adding additional configuration Kelper will make additional functions like minifying, building libraries and packages, copying resources.

There can be these configuration parameters:

* **uglify** - is used in finalization process to minify files
* **base** - is used in optimization and finalization process to define static libraries like jQuery, Backbone and others.
* **libraries** - is used in optimization and finalization process to define libraries that should be exported.
* **packages** - is used in optimization process to define RequireJS static packages.
* **hash** - is used in finalization process to define hash method.
* **resources** -  is used in finalization process to define static resources for copy process.

#### Uglify configuration parameter

Without this parameter finalization process will continue it's work without minification process. This is standart Uglify configuration that will be copied to it's process.

For more information [follow this link](https://github.com/gruntjs/grunt-contrib-uglify).

*Example of configuration:*

```
{
    "uglify": {
        "mangle": false,
        "compress": false,
        "beautify": true,
        "preserveComments": "some"
    }
}
```

#### Base configuration parameter

Base is used in optimization and finalization process to define static libraries like jQuery, Backbone and others.

*Example of usage:*

```
{
    "base": {
        "require": "lib/require/require",
        "jquery": "lib/jquery/jquery"
    }
}
```

#### Libraries configuration parameter

Libraries is used in optimization and finalization process to define libraries that should be exported.
This function automatically generates library files and compile them. All configurations that are set in packages are copied to configuration (config.js or app.nocache.js) files for usage.


*Example of usage:*

```
{
    "libraries": [
        {
            "name": "sample",
            "packages": [
                {
                    "name": "common"
                },
                {
                    "name": "application",
                    "config": {
                        "title": "My Application"
                    }
                }
            ]
        }
    ]
}
```

#### Packages configuration parameter

Packages is used in optimization process to define RequireJS static packages.

In ToDo:
xxx


#### HASH configuration parameter

Hash parameter is used in finalization process to define hash method. After all finalization process this function renames all files by it's content to it's HASH.

Default method is **"MD5"**.

To view all available methods:

- Open console (CMD or Terminal)
- Start Node.JS
- Write "Crypto.getHashes();"

#### Resources configuration parameter

Resource parameter is used in finalization process to define static resources for copy process. These parameter should contain array with name of folders that should be copied to finalization folder.

If parameter is not exist or is empty, finalization process continue it's work without copying these files.

*Example of usage:*

```
{
    "resources": [
        "main",
        "prod"
    ]
}
```
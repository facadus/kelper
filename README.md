# Kelper [![Build Status](https://travis-ci.org/facadus/kelper.svg?branch=master)](https://travis-ci.org/facadus/kelper)

Kelper is a tool that is based on Grunt and is used for simplifying the process of building projects from source. It is used to compile project with automatically checks for Unit test and UI test mistakes in webpages that are using by project.

##Features

* Be awesome
* Automatically download dependencies
* Autocompile, optimize and finalize project
* Make required tests

##Installation

This plugin requires Grunt `0.4.5 or newer`.

If you haven't used Grunt before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a Gruntfile as well as install and use Grunt plugins. 

Kelper can be installed with these methods:

```
npm install kelper --save
```

or add as dependency to package.json file.

```
"dependencies": {
    "kelper": "latest",
    "grunt": "^0.4.5"
}
```

Once the plugin has been installed, your Gruntfile should look like this:

```
module.exports = function (grunt) {
    grunt.loadNpmTasks('kelper');
};
```

Kelper after installation will parse all npm modules and if module has in **"package.json"** file configuration parameter **"moduleType"** with value **"AMD"** then plugin's inner content will be copied to project and it's files will be added to **".gitignore"** file.

##Configuration

To make plugin working you should create config folder in root of project directory.

There should be these folders:

* **build** (optional)
* **target**

### Build configuration
-----------------------

There can be 3 files that is used to setup builder configuration on each process that should be written as grunt export plugin. There files should contain Javascript and return JSON with pre-defined keys. These keys are parsed and used in builder.
If there is no files or configuration is set, will be taken default configuration.

Processes:

* **Compile** (compile.js) - Used to compile typescript
* **Optimization** (optimization.js) - Used to run RequireJS
* **Finalization** (finalization.js) - Used to minify, copy and hash files

By default all 3 tasks will be runned. There are 2 types, how this parameter can be changed:

 1. with additional parameter **-process** or **-p**;
 2. Use task **"kelper"** with process name ( *Only full process name is available* )

There are available these commands:

* **"c"** or **"compile"** - only compile process will be run
* **"o"** or **"optimization"** - will run compile and optimization task
* **"f"** or **"finalization"** - will run all 3 tasks

*Example of usage:*

```
grunt -process optimization
```

or

```
grunt kelper:optimization
```

#### Compile
------------

Compile process is used to compile TypeScript.
There are 3 main parameters:

* **source** - path of folder from base directory that should be compiled
* **target** - path of folder from base directory that collects compiled files
* **version** - compiled javascript standard
* **baseConfig** - is callback function that is used for each package, returned information will be merged or overwritten by environment config.
* **unitTestPattern** - pattern of unit test files (Default - **"*.unit.html"**)
* **jsMapping** - used to set specific file path to sources (Not to compiled version)

##### baseConfig
------------

This function is used as callback function for each package. Returned information will be merged or overwritten by environment config.

*Usage*:

* Firstly, will be taken default configuration and overwritten with baseConfig returned data.
* Secondly, will be taken Environment data and merged using smart merge function (object will be extended, arrays merged and all otherwise will be overwritten)

Function will receive object as first parameter that have these parameters:

* **name** *(string)* - Package name *(ex. "common")*
* **config** *(string)* - Package configuration name *(ex. "common/API")*
* **pkg** *(string)* - Package full name *(ex. "common/main")*
* **library** *(string, optional can be empty if not a library)* - Library name *(ex. "application")*
* **sourcePath** *(string)* - Full path of sources *(ex. "C:\work\Example\src\common")*
* **compiledPath** *(string)* - Full path of compile directory *(ex. "C:\work\Example\target\compiled\common")*

Function will receive as second parameter array of all packages.


*Example*:

```
module.exports = function(grunt){
    return {
        source: 'src',
        target: 'target/compiled',
        version: 'es5',
        baseConfig: function(pkg, allPackages){
            switch (pkg.name) {
                case "common":
                    return {
                        "libraryMetadata": [
                            grunt.file.readJSON(path.resolve(pkg.sourcePath, 'module.json'))
                        ]
                    };
                default:
                    return null;
            }
        }
    };
};
```

##### jsMapping
-----------------

jsMapping is used to set specific path from sources. It is used to work with native javascript files that are not compiled. Later it will be used in optimization process.

*Example of usage:*

```
jsMapping: {
	files: [
		"core/template/Compiler.js",
		"core/template/Parser.js"
	]
}
```

#### Optimization
-----------------

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
-----------------

Finalization process is used to minify, copying static resources and hash files.
There are 3 main parameters:

* **resourcePath** - resource folder path from base directory
* **source** - path of folder from base directory that should be finalized
* **target** - path of folder from base directory that collects finalized files
* **uiTestPattern** - pattern of unit test files (Default - **"*.test.html"**)

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
--------------------------------------

Environment configuration is used for builder to get project build information. All information should be in ***JSON*** or ***YAML*** format. Default file is **"local.json"** or **"local.yml"**, but if you need use another one, Kelper should be runned with additional parameter **"-target"** or **"-t"**.

*Example:*

```
grunt -target dev
```

Environment configuration all data is optional.

By adding additional configuration Kelper will make additional functions like minifying, building libraries and packages, copying resources.

There can be these configuration parameters:

* **uglify** - is used in finalization process to minimize files
* **base** - is used in optimization and finalization process to define static libraries like jQuery, Backbone and others.
* **shim** - is used in compile and optimization process to define static libraries export data and dependencies.
* **libraries** - is used in optimization and finalization process to define libraries that should be exported.
* **packages** - is used in optimization and finalization process to define RequireJS static packages.
* **hash** - is used in finalization process to define hash method.
* **resources** -  is used in finalization process to define static resources for copy process.

#### Uglify configuration parameter
-----------------------------------

Without this parameter finalization process will continue it's work without minimization process. This is standard Uglify configuration that will be copied to it's process.

For more information [follow this link](https://github.com/gruntjs/grunt-contrib-uglify).

*Example of configuration:*

```
  uglify:
    mangle: false
    compress: false
    beautify: true
    preserveComments: "none"
```

#### Base configuration parameter
---------------------------------

Base is used in optimization and finalization process to define static libraries like jQuery, Backbone and others.
RequireJS is not needed here, it will be automatically downloaded and loaded as library.

*Example of usage:*

```
  base:
    jquery: "lib/jquery/jquery"
```

#### Shim configuration parameter
---------------------------------

Shim is used in compile and optimization process to define static libraries export data and dependencies.

*Example of usage:*

```
  shim:
	jquery:
		exports: "$"
    underscore:
	    exports: "_"
	backbone
		deps:
			- "underscore"
			- "jquery"
		exports: "Backbone"
```

#### Libraries configuration parameter
--------------------------------------

Libraries is used in optimization and finalization process to define libraries that should be exported.
This function automatically generates library files and compile them. All configurations that are set in packages are copied to configuration (bootstrap.js or app.nocache.js) files for usage.

Each library has 3 parameters - **"name"** *(string)*, **"autoStart"** *(boolean)* and **"packages"** *(object)*, other parameters will be ignored. Library will be automatically generated from inner packages if they exist otherwise library will be ignored.

**Packages can contain only 2 value types:**

* ***object*** - pacakge that will be included into build
* ***boolean*** - package will be excluded from build

Each included packages has it's own configuration. For more information, look at next paragraph (Packages configuration parameter).

If library has ***autoStart*** option, it will be added as dependency to requireJS and will be loaded automatically.

*Example of usage:*

```
  libraries:
    application:
      sample: true
      packages:
        common: {}
        application:
          config:
            title: "My Application"
    widgets:
      packages:
        common: false
        widget1: {}
```

#### Packages configuration parameter
-------------------------------------

Packages is used in optimization and finalization process to define RequireJS static packages.

Packages can be used in libraries and separate configuration. Packages configuration looks as array of objects.

Each package contain 1 mandatory field **"name"** *(string)* and 3 optional fields:

* **"requireName"** *(string)* - is used to replace module require parameter *(example "async!common?1")*
* **"config"** *(object)* - is used to setup requireJS configuration
* **"replace"** *(object)* - is used to replace one module with another in production (For UI tests this replacements will be ignored)
* **"dependencies"** *(object)* - is used to add dependencies with ***glob*** functions. There are include and exclude functions available.

Configuration of package will be transferred like in libraries to bootstrap.js file into compile/optimization process and app.nocache.js file into finalization process.

*Example of usage:*

```
  packages:
    common:
      requireName: "async!common?1"
      replace:
        common/Component: "common/ComponentProd"
      dependencies:
        - "**/*.js"
        - "!**/*Test.js"
        - "!**/*Prod.js"
      config:
        title: "My package"
```


#### HASH configuration parameter
---------------------------------

Hash parameter is used in finalization process to define hash method. After all finalization process this function renames all files by it's content to it's HASH.

Default method is **"MD5"**.

To view all available methods:

- Open console (CMD or Terminal)
- Start Node.JS
- Write "Crypto.getHashes();"

#### Resources configuration parameter
--------------------------------------

Resource parameter is used in finalization process to define static resources for copy process. These parameter should contain array with name of folders that should be copied to finalization folder.

If parameter is not exist or is empty, finalization process continue it's work without copying these files.

*Example of usage:*

```
  resources:
    - "main"
    - "prod"
```

##Usage

If project is correctly configured, just launch project using `grunt`.

###Tests
-------------

Every test file should contain bootstrap script and ***__runTest*** function that is automatically extended to file. Test bootstrap file will be generated to ***compiled*** folder.
When adding bootstrap file, there should be added additional parameter ***test*** with value ***"ui"*** or ***"unit"*** depends on test file.

*Example of adding script:*

```
<script src="../../target/compiled/bootstrap.js" test="ui"></script>
```

### Unit tests
--------------

To use automatic Unit tests should be added HTML file directly into enabled package source folder that should be tested. Default file name format is `*.unit.html`

All unit tests will be run after compile process.

###UI tests
-----------

To use automatic UI tests should be added HTML file into enabled package source folder.
Default file name format is `*.unit.html`

All UI tests will be run after finalize process.

#Kelper 0.1.0

##Installation

Add as dependency to Gruntfile.js

```
"builder": "git+https://git.ctco.lv/r/~alexander.domotenko/training/builder.git"
```

##Configuration

To make plugin working you should create config folder in root of project directory
There should be these folders:

* **build** (optional)
* **environment**

### Build file configuration

There can be 3 files that is used to setup builder configuration on each process. These files should be written as grunt export plugin that contain Javascript and return JSON with pre-defined values. These values are parsed and used in builder.
If there is no files or configuration is not rewrited then default configuration will be taken.

Processes:

* **Compile** (compile.js) - Used to compile typescript
* **Optimization** (optimization.js) - Used to run RequireJS
* **Finalization** (finalization.js) - Used to minify, copy and hash files

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


### Environment file configuration


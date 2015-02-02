Project builder
==============

Installation
--------------

Add as dependency to Gruntfile.js

```
"builder": "git+https://git.ctco.lv/r/~alexander.domotenko/training/builder.git"
```

Configuration
--------------

To make plugin working you should create config folder in root of project directory
There should be these folders
* build (optional)
* environment

### Build file configuration

There can be 3 files that is used to setup builder configuration on each process.
If there is no files or configuration is not rewrited then default configuration will be taken.

Processes:
* Compile (compile.js) - Used to compile typescript
* Optimization (optimization.js) - Used to run RequireJS
* Finalization (finalization.js) - Used to minify, copy and hash files

#### Compile



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



*Example*:
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



*Example*:
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


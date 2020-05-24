# makef <a name="start"></a>

A utility to create files inside specified directory.

Features:
* Create synchronously one file or several files at once.
* Any content for a file is automatically converted to string. `JSON.stringify` is used to convert objects or arrays.
* It is possible to skip creating of some files by specifying `false`, `null` or `undefined` as content value.
* Determine whether a file should be created and/or form a file content dynamically by using a function as value for the file.
* Specify any correct path as a file name. The path will be resolved regarding current working directory. Any subdirectory will be automatically created.

```js
// Create several files in current working directory
makef.createFile({
    // The following file will be created with empty content
    'a.txt': '',
    // The following file will be created in subdirectory b
    'b/c.log': 'some data',
    // The following file will not be created
    'd.file': false,
    // The object that is specified as content will be converted to JSON
    'file.json': {some: 'data'}
});
```

[See more examples below.](#examples)

## Table of contents

* [Usage](#usage)
* [Examples](#examples)
* [API](#api)
* [Contributing](#contributing)
* [License](#license)

## Usage <a name="usage"></a> [&#x2191;](#start)

Installation:

    npm install makef

Next in a module:

```js
const createFile = require('makef').createFile;
```

## Examples <a name="examples"></a> [&#x2191;](#start)

Create one empty file:
```js
createFile('.nojekyll');
```
or
```js
createFile({'.nojekyll': ''});
```
or
```js
createFile({'.nojekyll': true});
```

Create several files at once:
```js
createFile({
    '.nojekyll': true,
    'LICENSE': 'Some license data here',
    'very/important/file.txt': 'very important data',
    'config.json': {
        a: 2,
        topics: ['home', 'docs'],
        url: 'http://some.server.net'
    }
});
```

Skip creating some files by setting `false`/`null` value for them:
```js
createFile({
    '.nojekyll': false,
    'a.txt': 'content',
    'some/dir/file.md': null
});
```

Specify directory where files should be created:
```js
createFile(
    {
        '.nojekyll': '',
        'data.json': {
            a: 1,
            b: {
                c: 3
            }
        },
        'subdir/file.data': 123
    },
    {
        dir: '/path/to/some/dir'
    }
);
```

Form content for a file dynamically or skip creation by using a function:
```js
const path = require('path');

function getContent(file, env) {
    return env.data.filter(env.filePath)
        ? env.data.getData(file)
        : null;
}

createFile(
    {
        'a.txt': getContent,
        'b.log': 'static data',
        'c.data': getContent,
        'some/dir/file.txt': getContent
    },
    {
        data: {
            filter: (file) => path.extname(file) === '.txt',
            getData: (file) => `content of ${file}`
        }
    }
);
```

See additional examples in tests.

## API <a name="api"></a> [&#x2191;](#start)

`createFile(fileSet, settings?): object`

Create specified files.

Arguments:

* `fileSet: object | string` - Name of empty file or set of files that should be created.
    
    If a string is passed it is treated as name of the only empty file that should be created.
    When an object is passed its fields are used as file names and field values determine contents
    for corresponding files.

    When a function is specified as field value it will be called to get content for the file.
    The following parameters are passed into a function:
    - `fileName: string` - name of file that should be created as specified in a field name of `fileSet`.
    - `env: object` - additional contextual data.
    - `env.data: any` - value of `settings.data` (see below).
    - `env.dir: string` - directory where file should be created; it is value of `settings.dir` (see below)
        or empty string.
    - `env.dirPath: string` - absolute path to directory where file should be created.
    - `env.filePath: string` - absolute path to file that should be created.

    A value returned from the function will be processed to form file content.

    Content values (specified as a field value or returned from a function) are treated in the following way:
    - `false`, `null` or `undefined` - means that the corresponding file should not be created.
    - `true` - means that the corresponding file should be created with empty content.
    - an object or an array - is converted to JSON that is used as file content.
    - any other value - is converted to string that is used as file content.
* `settings?: object` - Operation settings.
* `settings.context?: object` - Object that should be used as `this` when calling a function to get a file content.
* `settings.data?: any` - Any data that should be passed to a function that is used to get a file content.
* `settings.dir?: string` - Directory that will be used to resolve (form) absolute path for relative file names.
    I.e. it is base/target directory for created files.
    By default the current working directory is used.
* `settings.logger?: object` - An object having methods `log` (or `info`) and `error` that should be used for logging.
    Pass `false` to disable logging.
    Skipping this option or passing any other falsy value (i.e. `null`, `undefined`, `0`, etc)
    or `true` will cause to use `console` as logger.

Returns object representing creation result, or `undefined` when `fileSet` is not specified and no file is processed.
Object fields are file names as specified in `fileSet`,
a field value is absolute path of the corresponding file,
or error object when the file is not created by some reason.

## Contributing <a name="contributing"></a> [&#x2191;](#start)
In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code.

## License <a name="license"></a> [&#x2191;](#start)
Copyright (c) 2020 Denis Sikuler  
Licensed under the MIT license.

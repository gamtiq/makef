const path = require('path');

const fse = require('fs-extra');

exports.fse = fse;

function noop() {}

const loggerStub = {
    error: noop,
    log: noop
};

function getLogger(options) {
    const { logger } = options;

    // eslint-disable-next-line no-nested-ternary
    return logger === false
        ? loggerStub
        : (! logger || logger === true
            ? console
            : logger);
}

/**
 * Create specified files.
 * 
 * @param {object | string} fileSet
 *      Name of empty file or set of files that should be created.
 *      If a string is passed it is treated as name of the only empty file that should be created.
 *      When an object is passed its fields are used as file names and field values determine contents
 *      for corresponding files.
 *      When a function is specified as field value it will be called to get content for the file.
 *      The following parameters are passed into a function:
 *      - `fileName: string` - name of file that should be created as specified in a field name of `fileSet`.
 *      - `env: object` - additional contextual data.
 *      - `env.data: any` - value of `settings.data` (see below).
 *      - `env.dir: string` - directory where file should be created; it is value of `settings.dir` (see below)
 *          or empty string.
 *      - `env.dirPath: string` - absolute path to directory where file should be created.
 *      - `env.filePath: string` - absolute path to file that should be created.
 * 
 *      A value returned from the function will be processed to form file content.
 *      Content values (specified as a field value or returned from a function) are treated in the following way:
 *      - `false`, `null` or `undefined` - means that the corresponding file should not be created.
 *      - `true` - means that the corresponding file should be created with empty content.
 *      - an object or an array - is converted to JSON that is used as file content.
 *      - any other value - is converted to string that is used as file content.
 * @param {object} [settings]
 *      Operation settings.
 * @param {object} [settings.context]
 *      Object that should be used as `this` when calling a function to get a file content.
 * @param {*} [settings.data]
 *      Any data that should be passed to a function that is used to get a file content.
 * @param {string} [settings.dir]
 *      Directory that will be used to resolve (form) absolute path for relative file names.
 *      I.e. it is base/target directory for created files.
 *      By default the current working directory is used.
 * @param {boolean | object} [settings.logger=console]
 *      An object having methods `log` (or `info`) and `error` that should be used for logging.
 *      Pass `false` to disable logging.
 *      Skipping this option or passing any other falsy value (i.e. `null`, `undefined`, `0`, etc)
 *      or `true` will cause to use `console` as logger.
 * @return {object.<string, (string | Error)> | undefined}
 *      Object representing creation result, or `undefined` when `fileSet` is not specified (no file is processed).
 *      Object fields are file names as specified in `fileSet`,
 *      a field value is absolute path of the corresponding file,
 *      or error object when the file is not created by some reason.
 */
exports.createFile = function createFile(fileSet, settings) {
    const options = settings || {};
    const { context, data } = options;
    const dir = options.dir || '';
    const dirPath = path.resolve(dir);
    const logger = getLogger(options);
    const log = (logger.log || logger.info).bind(logger);
    const fileType = typeof fileSet;
    let result;

    if (fileSet && (fileType === 'string' || fileType === 'object')) {
        if (fileType === 'string') {
            // eslint-disable-next-line no-param-reassign
            fileSet = {[fileSet]: ''};
        }
        result = {};
        for (const fileName in fileSet) {
            const filePath = path.resolve(dir, fileName);
            let content = fileSet[fileName];
            if (typeof content === 'function') {
                log(`get content for file '${fileName}' from function`);
                content = content.call(
                    context,
                    fileName,
                    {
                        filePath,
                        dir,
                        dirPath,
                        data,
                        logger
                    }
                );
            }
            // eslint-disable-next-line eqeqeq, no-eq-null
            if (content === false || content == null) {
                log(`skip flag '${content}' is set for file '${fileName}' so it is not created`);
            }
            else {
                if (content === true) {
                    content = '';
                }
                else if (typeof content === 'object') {
                    content = JSON.stringify(content, null, 4);
                }
                else {
                    content = String(content);
                }
                try {
                    fse.outputFileSync(filePath, content);
                    result[fileName] = filePath;
                    log(`file '${filePath}' is created`);

                }
                catch (e) {
                    result[fileName] = e;
                    logger.error(`cannot create file '${filePath}'; error details -\n${e}`);
                }
            }
        }
    }
    else {
        log('no files are specified as value of "fileSet" parameter');
    }

    return result;
};

/**
 * Copy specified file.
 *
 * @param {string} sourceFile
 *      Name/path of file that should be copied.
 * @param {string} [destFile]
 *      Name/path of destination file that should be created.
 *      If the file is not set a partially applied function will be returned
 *      that can be used to copy source file several times by passing a destination file and settings as arguments.
 * @param {object} [settings]
 *      Operation settings.
 * @param {string} [settings.dir]
 *      Directory where destination file should be created.
 *      By default the current working directory is used.
 * @param {boolean | object} [settings.logger=console]
 *      An object having methods `log` (or `info`) and `error` that should be used for logging.
 *      See the corresponding setting of {@link createFile} for details.
 * @param {string} [settings.sourceDir]
 *      Directory where source file is located.
 */
exports.copyFile = function copyFile(sourceFile, destFile, settings) {   // eslint-disable-line consistent-return
    if (sourceFile) {
        if (destFile) {
            const options = settings || {};
            const logger = getLogger(options);
            const sourcePath = path.resolve(options.sourceDir || '', sourceFile);
            const destPath = path.resolve(options.dir || '', destFile);
            try {
                fse.copySync(sourcePath, destPath, {overwrite: true});
                logger.log(`file '${sourcePath}' is copied to '${destPath}'`);
            }
            catch (e) {
                logger.error(`cannot copy file '${sourcePath}' to '${destPath}'; error details -\n${e}`);
            }
        }
        else {
            return function partialCopyFile(fileName, copySettings) {
                return copyFile(sourceFile, fileName, copySettings);
            };
        }
    }
};

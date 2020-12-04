const path = require('path');
const fse = require('fs-extra');

const makef = require('./index');

const logger = {
    error: jest.fn(),
    log: jest.fn()
};

describe('makef', function makefSuite() {
    
    const sourceDir = './source-data';
    const sourcePath = path.join(__dirname, sourceDir);
    const sourceFile1 = 'source-file-1.txt';
    const sourceFilePath1 = path.join(sourcePath, sourceFile1);
    const sourceFile2 = 'test.file.data';
    const sourceFilePath2 = path.join(sourcePath, sourceFile2);

    const testDir = './test-doc';
    const testPath = path.join(__dirname, testDir);

    let origConsoleError, origConsoleLog, undef;

    function mockConsole() {
        origConsoleLog = console.log;
        console.log = jest.fn();
        origConsoleError = console.error;
        console.error = jest.fn();
    }

    function restoreConsole() {
        console.log = origConsoleLog;
        console.error = origConsoleError;
    }
    
    function stringify(data) {
        return JSON.stringify(data, null, 4);
    }

    function getFileList(dir) {
        return fse.readdirSync(dir || testPath);
    }

    function getFileQty(dir) {
        return getFileList(dir).length;
    }
    
    function getFileContent(file) {
        return `content for ${file}`;
    }

    function createSourceFiles() {
        fse.outputFileSync(sourceFilePath1, getFileContent(sourceFile1));
        fse.outputFileSync(sourceFilePath2, getFileContent(sourceFile2));
    }

    function checkFileList(expectedFileSet, dir) {
        const destDir = dir || testPath;
        const fileList = getFileList(destDir);
        let qty = 0;

        for (const fileName in expectedFileSet) {
            expect( fileList[qty] )
                .toBe( fileName );
            const filePath = path.join(destDir, fileName);
            const stat = fse.statSync(filePath);
            if (stat.isDirectory()) {
                checkFileList(expectedFileSet[fileName], filePath);
            }
            else {
                expect( fse.readFileSync(filePath, {encoding: 'utf8'}) )
                    .toBe( expectedFileSet[fileName] );
            }
            qty++;
        }

        expect( fileList.length )
            .toBe( qty );
    }

    function checkSourceDir() {
        checkFileList(
            {
                [sourceFile1]: getFileContent(sourceFile1),
                [sourceFile2]: getFileContent(sourceFile2)
            },
            sourcePath
        );
    }

    function checkLogCall(expectedLog, logLevel, usedLogger) {
        const log = Array.isArray(expectedLog)
            ? expectedLog
            : [expectedLog];
        const logCalls = (usedLogger || logger)[logLevel || 'log'].mock.calls;
        const logLen = log.length;

        expect( logCalls.length >= logLen )
            .toBe( true );
        for (let i = 0; i < logLen; i++) {
            expect( logCalls[i][0] )
                .toMatch( log[i] );
        }
    }


    describe('createFile', function createFileSuite() {
        const { createFile } = makef;
    
        beforeEach(function before() {
            fse.mkdirSync(testPath);
            process.chdir(testPath);
        });
    
        afterEach(function after() {
            process.chdir(__dirname);
            fse.removeSync(testPath);
            jest.clearAllMocks();
        });
    
        function runCreateFile(...args) {
            args[1] = Object.assign({logger}, args[1]);
    
            return createFile(...args);
        }
    
        function checkResult(result, expectedResult) {
            for (const field in expectedResult) {
                let value = expectedResult[field];
                const resultValue = result[field];
                expect( resultValue )
                    .toBeDefined();
                if (value === true) {
                    value = path.join(testPath, field);
                }
                if (typeof value === 'string') {
                    expect( resultValue )
                        .toBe( value );
                }
                else if (value instanceof Error) {
                    expect( resultValue )
                        .toBeInstanceOf( Error );
                }
            }
        }
    
        it('should not create any file', () => {
            expect( runCreateFile() )
                .toBeUndefined();
    
            expect( getFileQty() )
                .toBe( 0 );
    
            checkLogCall('no files');
        });
    
        describe('should create single empty file whose name is specified as string value', () => {
            it('in current working directory when simple file name is passed', () => {
                const fileName = '.nojekyll';
                const filePath = path.join(testPath, fileName);
        
                checkResult(
                    runCreateFile(fileName),
                    {
                        [fileName]: filePath
                    }
                );
        
                checkFileList({[fileName]: ''});
        
                checkLogCall([
                    `file '${filePath}' is created`
                ]);
            });
    
            it('in current working directory when relative path is passed', () => {
                const fileName = 'a/b.test';
                const filePath = path.join(testPath, fileName);
        
                checkResult(
                    runCreateFile(fileName),
                    {
                        [fileName]: filePath
                    }
                );
        
                checkFileList({
                    'a': {
                        'b.test': ''
                    }
                });
        
                checkLogCall([
                    `file '${filePath}' is created`
                ]);
            });
    
            it('in directory from passed absolute path', () => {
                const fileName = path.join(testPath, 'a/b.test');
        
                checkResult(
                    runCreateFile(fileName),
                    {
                        [fileName]: fileName
                    }
                );
        
                checkFileList({
                    'a': {
                        'b.test': ''
                    }
                });
        
                checkLogCall([
                    `file '${path.join(fileName)}' is created`
                ]);
            });
    
            it('in given directory when simple file name is passed', () => {
                const fileName = '.nojekyll';
                const dir = 'abc';
                const filePath = path.join(testPath, dir, fileName);
        
                checkResult(
                    runCreateFile(fileName, {dir}),
                    {
                        [fileName]: filePath
                    }
                );
        
                checkFileList({
                    [dir]: {
                        [fileName]: ''
                    }
                });
        
                checkLogCall([
                    `file '${filePath}' is created`
                ]);
            });
    
            it('in given directory when relative path is passed', () => {
                const fileName = 'a/b.test';
                const dir = 'target';
                const filePath = path.join(testPath, dir, fileName);
        
                checkResult(
                    runCreateFile(fileName, {dir}),
                    {
                        [fileName]: filePath
                    }
                );
        
                checkFileList({
                    [dir]: {
                        'a': {
                            'b.test': ''
                        }
                    }
                });
        
                checkLogCall([
                    `file '${filePath}' is created`
                ]);
            });
    
            it('in directory from passed absolute path regardless of dir setting', () => {
                const fileName = path.join(testPath, 'a/b.test');
        
                checkResult(
                    runCreateFile(fileName, {dir: 'some/useful/dir'}),
                    {
                        [fileName]: fileName
                    }
                );
        
                checkFileList({
                    'a': {
                        'b.test': ''
                    }
                });
        
                checkLogCall([
                    `file '${path.join(fileName)}' is created`
                ]);
            });
        });
    
        describe('should overwrite existent file', () => {
            it('in current working directory', () => {
                const fileName = 'test-file.txt';
                const filePath = path.join(testPath, fileName);
                const content = `content of ${fileName}`;
        
                fse.outputFileSync(filePath, 'some data');
        
                checkResult(
                    runCreateFile({[fileName]: content}),
                    {
                        [fileName]: filePath
                    }
                );
        
                checkFileList({[fileName]: content});
        
                checkLogCall([
                    `file '${filePath}' is created`
                ]);
            });
        
            it('in specified directory', () => {
                const fileName = 'test-file.txt';
                const filePath = 'some/dir';
                const content = `content of ${filePath}/${fileName}`;
                const targetDir = path.join(testPath, filePath);
                const targetPath = path.join(targetDir, fileName);
        
                fse.outputFileSync(targetPath, 'some data');
        
                runCreateFile({[fileName]: content}, {dir: targetDir});
        
                checkFileList({[fileName]: content}, targetDir);
        
                checkLogCall([
                    `file '${targetPath}' is created`
                ]);
            });
        
            it('specified by absolute path', () => {
                const fileName = 'file.txt';
                const filePath = 'some/test/dir';
                const content = `content of ${filePath}/${fileName}`;
                const targetDir = path.join(testPath, filePath);
                const targetPath = path.join(targetDir, fileName);
        
                fse.outputFileSync(targetPath, 'some data');
        
                runCreateFile({[targetPath]: content}, {dir: 'another/dir'});
        
                checkFileList({[fileName]: content}, targetDir);
        
                checkLogCall([
                    `file '${targetPath}' is created`
                ]);
            });
        });
    
        it('should create file and overwrite another existent file', () => {
            const abcPath = path.join(testPath, 'abc');
            const fileName = 'test/file.md';
            const filePath = path.join(testPath, fileName);
            const content = `### TOC of ${fileName}`;
            const data = ['some', 5, false, null];
    
            fse.outputFileSync(filePath, 'Markdown');
    
            checkResult(
                runCreateFile({
                    'abc': data,
                    [fileName]: content
                }),
                {
                    'abc': abcPath,
                    [fileName]: filePath
                }
            );
    
            checkFileList({
                'abc': stringify(data),
                'test': {
                    'file.md': content
                }
            });
    
            checkLogCall([
                `file '${abcPath}' is created`,
                `file '${filePath}' is created`
            ]);
        });
    
        it('should not create file because of incorrect name', () => {
            const fileName = 'http://some.where.in.universe/planet/fire';
    
            checkResult(
                runCreateFile(fileName),
                {
                    [fileName]: new Error('Incorrect file name')
                }
            );
    
            checkFileList({});
    
            checkLogCall(`cannot create file '${path.join(testPath, fileName)}'`, 'error');
        });
    
        describe('should create several files', () => {
            beforeEach(function before() {
                createSourceFiles();
            });

            afterEach(function after() {
                fse.removeSync(sourcePath);
            });

            it('in current working directory', () => {
                const absoluteFile = path.join(testPath, 'x-absolute/file.test');
                const absoluteData = 'salut';
                const obj = {
                    b: {
                        c: ['destiny']
                    }
                };
                const json = stringify(obj);
    
                checkResult(
                    runCreateFile({
                        '.nojekyll': true,
                        'a.txt': 38,
                        'b/c/d.txt': obj,
                        'f.data': getFileContent,
                        'last-file': 'last line',
                        'some-copy.abc': makef.copyFile(sourceFilePath1),
                        [absoluteFile]: absoluteData
                    }),
                    {
                        '.nojekyll': true,
                        'a.txt': true,
                        'b/c/d.txt': true,
                        'f.data': true,
                        'last-file': true,
                        [absoluteFile]: absoluteFile
                    }
                );
    
                checkFileList({
                    '.nojekyll': '',
                    'a.txt': '38',
                    'b': {
                        'c': {
                            'd.txt': json
                        }
                    },
                    'f.data': getFileContent('f.data'),
                    'last-file': 'last line',
                    'some-copy.abc': getFileContent(sourceFile1),
                    'x-absolute': {
                        'file.test': absoluteData
                    }
                });
                checkFileList(
                    {
                        'd.txt': json
                    },
                    path.join(testPath, 'b/c')
                );
                checkFileList(
                    {
                        'file.test': absoluteData
                    },
                    path.join(testPath, 'x-absolute')
                );
    
                checkLogCall([
                    `file '${path.join(testPath, '.nojekyll')}' is created`,
                    `file '${path.join(testPath, 'a.txt')}' is created`,
                    `file '${path.join(testPath, 'b/c/d.txt')}' is created`,
                    "get content for file 'f.data' from function",
                    `file '${path.join(testPath, 'f.data')}' is created`,
                    `file '${path.join(testPath, 'last-file')}' is created`,
                    "get content for file 'some-copy.abc' from function",
                    `file '${sourceFilePath1}' is copied to '${path.join(testPath, 'some-copy.abc')}'`,
                    `skip flag '${undef}' is set for file 'some-copy.abc' so it is not created`,
                    `file '${absoluteFile}' is created`
                ]);
            });
    
            it('in specified directory', () => {
                const absoluteFile = path.join(testPath, 'x-absolute/file.test');
                const absoluteData = 'salut';
                const dir = 'target';
                const obj = {
                    b: {
                        c: ['destiny']
                    }
                };
                const json = stringify(obj);
    
                runCreateFile(
                    {
                        '.nojekyll': true,
                        'a.txt': 38,
                        'b/c/d.txt': obj,
                        'file.dat.log': getFileContent,
                        'last-file': 'last line',
                        'some/copied/file': makef.copyFile(sourceFilePath2),
                        [absoluteFile]: absoluteData
                    },
                    {
                        dir
                    }
                );
    
                checkFileList({
                    [dir]: {
                        '.nojekyll': '',
                        'a.txt': '38',
                        'b': {
                            'c': {
                                'd.txt': json
                            }
                        },
                        'file.dat.log': getFileContent('file.dat.log'),
                        'last-file': 'last line',
                        'some': {
                            'copied': {
                                'file': getFileContent(sourceFile2)
                            }
                        }
                    },
                    'x-absolute': {
                        'file.test': absoluteData
                    }
                });
                checkFileList(
                    {
                        'd.txt': json
                    },
                    path.join(testPath, dir, 'b/c')
                );
                checkFileList(
                    {
                        'file': getFileContent(sourceFile2)
                    },
                    path.join(testPath, dir, 'some/copied')
                );
                checkFileList(
                    {
                        'file.test': absoluteData
                    },
                    path.join(testPath, 'x-absolute')
                );
    
                checkLogCall([
                    `file '${path.join(testPath, dir, '.nojekyll')}' is created`,
                    `file '${path.join(testPath, dir, 'a.txt')}' is created`,
                    `file '${path.join(testPath, dir, 'b/c/d.txt')}' is created`,
                    "get content for file 'file.dat.log' from function",
                    `file '${path.join(testPath, dir, 'file.dat.log')}' is created`,
                    `file '${path.join(testPath, dir, 'last-file')}' is created`,
                    "get content for file 'some/copied/file' from function",
                    `file '${sourceFilePath2}' is copied to '${path.join(testPath, 'target/some/copied/file')}'`,
                    `skip flag '${undef}' is set for file 'some/copied/file' so it is not created`,
                    `file '${absoluteFile}' is created`
                ]);
            });
        });
    
        it('should skip creating some files', () => {
            const de = path.join(testPath, 'd/e.tmp');
            const xy = path.join(testPath, 'x/y.z');
    
            function getContent(file) {
                return path.extname(file) === '.txt';
            }
    
            runCreateFile({
                'a.txt': false,
                'b/c.md': 'false',
                'end.log': null,
                [de]: true,
                'no.ext': getContent,
                'makef.txt': getContent,
                [xy]: undef
            });
    
            checkFileList({
                'b': {
                    'c.md': 'false'
                },
                'd': {
                    'e.tmp': ''
                },
                'makef.txt': ''
            });
    
            checkLogCall([
                "skip flag 'false' is set for file 'a.txt'",
                `file '${path.join(testPath, 'b/c.md')}' is created`,
                "skip flag 'null' is set for file 'end.log'",
                `file '${de}' is created`,
                "get content for file 'no.ext' from function",
                "skip flag 'false' is set for file 'no.ext'",
                "get content for file 'makef.txt' from function",
                `file '${path.join(testPath, 'makef.txt')}' is created`,
                `skip flag 'undefined' is set for file '${xy}'`
            ]);
        });
    
        it('should create file depending on condition', () => {
            function getContent(file, env) {
                return env.data.filter(env.filePath)
                    ? env.data.getData(file)
                    : null;
            }
    
            runCreateFile(
                {
                    'a.txt': getContent,
                    'b.data': getContent,
                    'read': () => true
                },
                {
                    data: {
                        filter: (file) => path.extname(file) === '.data',
                        getData: getFileContent
                    }
                }
            );
    
            checkFileList({
                'b.data': getFileContent('b.data'),
                'read': ''
            });
    
            checkLogCall([
                "get content for file 'a.txt' from function",
                "skip flag 'null' is set for file 'a.txt'",
                "get content for file 'b.data' from function",
                `file '${path.join(testPath, 'b.data')}' is created`,
                "get content for file 'read' from function",
                `file '${path.join(testPath, 'read')}' is created`
            ]);
        });
    
        it('should use value of settings.context as `this` when calling content function', () => {
            const dir = 'test-dir';
            const context = {
                num: 1,
                getContent(file, env) {
                    return `${this.num++}: ${env.dir}/${file}`;
                }
            };
    
            runCreateFile(
                {
                    'a.txt': context.getContent,
                    'b.data': 0,
                    'c/d.log': context.getContent
                },
                {
                    dir,
                    context
                }
            );
    
            checkFileList({
                [dir]: {
                    'a.txt': `1: ${dir}/a.txt`,
                    'b.data': '0',
                    'c': {
                        'd.log': `2: ${dir}/c/d.log`
                    }
                }
            });
    
            checkLogCall([
                "get content for file 'a.txt' from function",
                `file '${path.join(testPath, dir, 'a.txt')}' is created`,
                `file '${path.join(testPath, dir, 'b.data')}' is created`,
                "get content for file 'c/d.log' from function",
                `file '${path.join(testPath, dir, 'c/d.log')}' is created`
            ]);
        });
    
        describe('settings.logger', () => {
            it('should use "info" method instead of "log"', () => {
                logger.info = logger.log;
                delete logger.log;
    
                const fileName = 'test.file';
                const content = 'test data';
    
                runCreateFile({
                    [fileName]: content
                });
    
                checkFileList({
                    [fileName]: content
                });
    
                checkLogCall(
                    `file '${path.join(testPath, fileName)}' is created`,
                    'info'
                );
    
                logger.log = logger.info;
                delete logger.info;
            });
    
            it('should use console as logger when settings.logger === true', () => {
                const fileName = 'a.b.c';
                const incorrectName = 'ftp::://some:where?/it.is!';
    
                mockConsole();
    
                checkResult(
                    runCreateFile(
                        {
                            [fileName]: '',
                            [incorrectName]: 345
                        },
                        {
                            logger: true
                        }
                    ),
                    {
                        [fileName]: true,
                        [incorrectName]: new Error('Incorrect file name')
                    }
                );
    
                checkFileList({
                    [fileName]: ''
                });
    
                checkLogCall(
                    `file '${path.join(testPath, fileName)}' is created`,
                    'log',
                    console
                );
                checkLogCall(
                    `cannot create file '${path.join(testPath, incorrectName)}'`,
                    'error',
                    console
                );
    
                restoreConsole();
            });
    
            it('should use console as logger when no settings.logger is set', () => {
                const dir = 'some-dir';
                const fileName = 'a.b.c.d.e.f';
                const incorrectName = 'whois::://some:where?/it.!$@#-;';
    
                mockConsole();
    
                createFile(
                    {
                        [fileName]: fileName,
                        [incorrectName]: 'correct me'
                    },
                    {
                        dir
                    }
                );
    
                checkFileList({
                    [dir]: {
                        [fileName]: fileName
                    }
                });
    
                checkLogCall(
                    `file '${path.join(testPath, dir, fileName)}' is created`,
                    'log',
                    console
                );
                checkLogCall(
                    `cannot create file '${path.join(testPath, dir, incorrectName)}'`,
                    'error',
                    console
                );
    
                restoreConsole();
            });
    
            it('should not log when settings.logger === false', () => {
                const dir = 'a.b.c';
                const fileName = 'test.file';
                const content = `${dir}/${fileName}`;
    
                mockConsole();
    
                runCreateFile(
                    {
                        [fileName]: content
                    },
                    {
                        dir,
                        logger: false
                    }
                );
    
                checkFileList({
                    [dir]: {
                        [fileName]: content
                    }
                });
    
                expect( console.log.mock.calls.length )
                    .toBe( 0 );
                expect( console.error.mock.calls.length )
                    .toBe( 0 );
    
                restoreConsole();
            });
        });
    });

    describe('copyFile', function copyFileSuite() {
        const { copyFile } = makef;
    
        beforeEach(function before() {
            createSourceFiles();
            fse.mkdirSync(testPath);
            process.chdir(testPath);
        });
    
        afterEach(function after() {
            process.chdir(__dirname);
            fse.removeSync(sourcePath);
            fse.removeSync(testPath);
            jest.clearAllMocks();
        });
    
        function runCopyFile(...args) {
            args[2] = Object.assign({logger}, args[2]);
    
            return copyFile(...args);
        }

        function check(copyArgs, expectedFileSet, expectedLog) {
            runCopyFile(...copyArgs);

            checkSourceDir();
            checkFileList(expectedFileSet);
            checkLogCall(expectedLog);
        }

        it('should do nothing', () => {
            expect( runCopyFile() )
                .toBeUndefined();
            checkSourceDir();
            expect( getFileQty(testPath) )
                .toBe( 0 );
            expect( logger.log.mock.calls.length )
                .toBe( 0 );
            expect( logger.error.mock.calls.length )
                .toBe( 0 );
        });

        it('should return partially applied function', () => {
            const destFile1 = 'copy1.txt';
            const destFile2 = 'file.data';

            let copier = runCopyFile(sourceFile1);

            expect( typeof copier )
                .toBe( 'function' );

            copier(destFile1, {sourceDir: sourcePath, dir: testPath, logger});

            copier = runCopyFile(sourceFilePath2);

            expect( typeof copier )
                .toBe( 'function' );

            copier(path.join(testPath, destFile2), {logger});

            checkSourceDir();

            checkFileList({
                [destFile1]: getFileContent(sourceFile1),
                [destFile2]: getFileContent(sourceFile2)
            });
    
            checkLogCall([
                `file '${sourceFilePath1}' is copied to '${path.join(testPath, destFile1)}'`,
                `file '${sourceFilePath2}' is copied to '${path.join(testPath, destFile2)}'`
            ]);
        });

        it('should copy file', () => {
            const destFile = 'target.file';
            const destPath = path.join(testPath, destFile);

            check(
                [
                    sourceFilePath1,
                    destPath
                ],
                {
                    [destFile]: getFileContent(sourceFile1)
                },
                [
                    `file '${sourceFilePath1}' is copied to '${destPath}'`
                ]
            );
        });

        it('should copy file from specified source directory', () => {
            const destFile = 'target.file';
            const destPath = path.join(testPath, destFile);

            check(
                [
                    sourceFile1,
                    destPath,
                    {sourceDir: sourcePath}
                ],
                {
                    [destFile]: getFileContent(sourceFile1)
                },
                [
                    `file '${sourceFilePath1}' is copied to '${destPath}'`
                ]
            );
        });

        it('should copy file to specified target directory', () => {
            const destFile = 'test.file';
            const destPath = path.join(testPath, 'target/dir');

            check(
                [
                    sourceFilePath2,
                    destFile,
                    {dir: destPath}
                ],
                {
                    target: {
                        dir: {
                            [destFile]: getFileContent(sourceFile2)
                        }
                    }
                },
                [
                    `file '${sourceFilePath2}' is copied to '${path.join(destPath, destFile)}'`
                ]
            );
        });

        it('should overwrite existent file', () => {
            const destFile = 'test.file';
            const destPath = path.join(testPath, 'target/dir');
            const targetFilePath = path.join(destPath, destFile);
            const initialContent = 'm a k e f';

            fse.outputFileSync(targetFilePath, initialContent);

            checkFileList({
                target: {
                    dir: {
                        [destFile]: initialContent
                    }
                }
            });

            check(
                [
                    sourceFile2,
                    destFile,
                    {sourceDir: sourcePath, dir: destPath}
                ],
                {
                    target: {
                        dir: {
                            [destFile]: getFileContent(sourceFile2)
                        }
                    }
                },
                [
                    `file '${sourceFilePath2}' is copied to '${targetFilePath}'`
                ]
            );
        });
    });
    
});

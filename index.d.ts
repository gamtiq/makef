// Created on the basis of http://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html

export type LogFunction = (...args: any[]) => void;

export interface Logger {
    error: LogFunction;
    info?: LogFunction;
    log: LogFunction;
    [field: string]: unknown;
}

export type LoggerSetting = Logger | boolean | null | undefined | 0;

export interface GetFileContentEnv {
    data: any;
    dir: string;
    dirPath: string;
    filePath: string;
    logger: Logger;
}

export type GetFileContent =
    | (() => unknown)
    | ((file: string) => unknown)
    | ((file: string, env: GetFileContentEnv, ...args: any[]) => unknown);

export type CreateFileSet = Record<string, unknown>;

export interface CreateFileSettings {
    context?: object;
    data?: any;
    dir?: string;
    logger?: LoggerSetting;
}

export function createFile(fileSet: CreateFileSet | string, settings?: CreateFileSettings): Record<string, string | Error> | undefined;


export interface CopyFileSettings {
    dir?: string;
    logger?: LoggerSetting;
    sourceDir?: string;
}

export type PartialCopyFile = (destFile: string, settings?: CopyFileSettings) => void;

export function copyFile(sourceFile: string): PartialCopyFile;
export function copyFile(sourceFile: string, destFile: string, settings?: CopyFileSettings): void;
export function copyFile(sourceFile: string, destFile?: string, settings?: CopyFileSettings): PartialCopyFile | void;

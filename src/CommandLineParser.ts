import yargs from 'yargs';
import colors from 'colors';
import fs from 'fs';

export const argv = yargs.options({
    videoUrls: {
        alias: 'V',
        describe: 'List of video urls',
        type: 'array',
        demandOption: false
    },
    videoUrlsFile: {
        alias: 'F',
        describe: 'Path to txt file containing the urls',
        type: 'string',
        demandOption: false
    },
    username: {
        alias: 'u',
        type: 'string',
        demandOption: false
    },
    outputDirectory: {
        alias: 'o',
        type: 'string',
        default: 'videos',
        demandOption: false
    },
    noThumbnails: {
        alias: 'nthumb',
        describe: `Do not display video thumbnails`,
        type: 'boolean',
        default: false,
        demandOption: false
    },
    simulate: {
        alias: 's',
        describe: `Disable video download and print metadata information to the console`,
        type: 'boolean',
        default: false,
        demandOption: false
    },
    verbose: {
        alias: 'v',
        describe: `Print additional information to the console (use this before opening an issue on GitHub)`,
        type: 'boolean',
        default: false,
        demandOption: false
    }
})
/**
 * Do our own argv magic before destreamer starts.
 * ORDER IS IMPORTANT!
 * Do not mess with this.
 */
.check(() => isShowHelpRequest())
.check(argv => checkRequiredArgument(argv))
.check(argv => checkVideoUrlsArgConflict(argv))
.check(argv => checkVideoUrlsInput(argv))
.check(argv => windowsFileExtensionBadBehaviorFix(argv))
.check(argv => mergeVideoUrlsArguments(argv))
.argv;


const enum CLI_ERROR {
    GRACEFULLY_STOP           = ' ', // gracefully stop execution, yargs way

    MISSING_REQUIRED_ARG      = 'You must specify a URLs source.\n' +
                                'Valid options are --videoUrls or --videoUrlsFile.',

    VIDEOURLS_ARG_CONFLICT    = 'Too many URLs sources specified!\n' +
                                'Please specify a single URLs source with either --videoUrls or --videoUrlsFile.',

    FILE_INPUT_VIDEOURLS_ARG  = 'Wrong input for option --videoUrls.\n' +
                                'To read URLs from file, use --videoUrlsFile option.',

    INPUT_URLS_FILE_NOT_FOUND = 'Input URL list file not found.'
}


function hasNoArgs() {
    return process.argv.length === 2;
}

function isShowHelpRequest() {
    if (hasNoArgs())
        throw new Error(CLI_ERROR.GRACEFULLY_STOP);

    return true;
}

function checkRequiredArgument(argv: any) {
    if (hasNoArgs())
        return true;

    if (!argv.videoUrls && !argv.videoUrlsFile)
        throw new Error(colors.red(CLI_ERROR.MISSING_REQUIRED_ARG));

    return true;
}

function checkVideoUrlsArgConflict(argv: any) {
    if (hasNoArgs())
        return true;

    if (argv.videoUrls && argv.videoUrlsFile)
        throw new Error(colors.red(CLI_ERROR.VIDEOURLS_ARG_CONFLICT));

    return true;
}

function checkVideoUrlsInput(argv: any) {
    if (hasNoArgs() || !argv.videoUrls)
        return true;

    if (!argv.videoUrls.length)
        throw new Error(colors.red(CLI_ERROR.MISSING_REQUIRED_ARG));

    const t = argv.videoUrls[0] as string;
    if (t.substring(t.length-4) === '.txt')
        throw new Error(colors.red(CLI_ERROR.FILE_INPUT_VIDEOURLS_ARG));

    return true;
}

/**
 * Users see 2 separate options, but we don't really care
 * cause both options have no difference in code.
 *
 * Optimize and make this transparent to destreamer
 */
function mergeVideoUrlsArguments(argv: any) {
    if (!argv.videoUrlsFile)
        return true;

    argv.videoUrls = [argv.videoUrlsFile]; // noone will notice ;)

    // these are not valid anymore
    delete argv.videoUrlsFile;
    delete argv.F;

    return true;
}

// yeah this is for windows, but lets check everyone, who knows...
function windowsFileExtensionBadBehaviorFix(argv: any) {
    if (hasNoArgs() || !argv.videoUrlsFile)
        return true;

    if (!fs.existsSync(argv.videoUrlsFile)) {
        if (fs.existsSync(argv.videoUrlsFile + '.txt'))
            argv.videoUrlsFile += '.txt';
        else
            throw new Error(colors.red(CLI_ERROR.INPUT_URLS_FILE_NOT_FOUND));
    }

    return true;
}
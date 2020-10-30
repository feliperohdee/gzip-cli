const fs = require('fs');
const glob = require('glob');
const path = require('path');
const shell = require('shelljs');
const zlib = require('zlib');

let [
    inPath,
    ...types
] = process.argv.slice(2);

if (!inPath) {
    return console.log('no input path found.');
}

if (!fs.existsSync(inPath)) {
    return console.log('inexistent path', inPath);
}

if (!types.length) {
    types = ['html', 'css', 'js', 'json', 'txt'];
}

types = types.reduce((reduction, type) => {
    return [
        ...reduction,
        ...type.split(',').map(type => {
            return type.trim();
        })
        .filter(Boolean)
    ];
}, []);

const gzipPath = path.join(inPath, 'gzip');
const noGzipPath = path.join(inPath, 'no-gzip');

shell.rm('-rf', gzipPath);
shell.rm('-rf', noGzipPath);

if (!fs.existsSync(gzipPath)) {
    shell.mkdir('-p', gzipPath);
}

if (!fs.existsSync(noGzipPath)) {
    shell.mkdir('-p', noGzipPath);
}

const files = glob.sync(inPath + '/**/*.*');
const {
    gzip,
    noGzip
} = files.reduce((reduction, file) => {
    let buffer = fs.readFileSync(file);
    let outDir;
    let outFile;

    const matchType = types.some(type => {
        return file.endsWith(`.${type}`);
    });

    if (matchType) {
        buffer = zlib.gzipSync(buffer, {
            level: 9
        });

        outFile = path.join(gzipPath, file.replace(inPath, ''));
        reduction.gzip.push(outFile);
    } else {
        outFile = path.join(noGzipPath, file.replace(inPath, ''));
        reduction.noGzip.push(outFile);
    }

    outDir = path.dirname(outFile);

    if (!fs.existsSync(outDir)) {
        shell.mkdir('-p', outDir);
    }

    fs.writeFileSync(outFile, buffer);

    return reduction;
}, {
    gzip: [],
    noGzip: []
});

console.log({
    gzip,
    gzipPath,
    noGzip,
    noGzipPath,
    types
});

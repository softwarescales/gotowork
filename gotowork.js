var fs = require('fs');
var optimist = require('optimist');

var DEFAULT_DESCRIPTOR_PATH = 'deployment.json';


function validate(argv) {
    // correct port
    var port = argv.port;
    if (typeof port !== 'number' || port < 1 || port > 65535 || Math.round(port) != port) {
        throw 'port must be an integer value from 1 to 65535. Provided value: ' + port;
    }
}

function dotNotation(key, object, parentObject) {

    if (typeof object !== 'object') {
        return;
    }

    for (var i in object) {
        var newKey = key + '.' + i;
        if (typeof object[i] !== 'object') {
            parentObject[newKey] = object[i];
            continue;
        }

        if (object[i] instanceof Array) {
            var arrayVal = [];
            for (var j in object[i]) {
                arrayVal.push(typeof object[i][j] === 'object' ? null : object[i][j]);
            }
            parentObject[newKey] = arrayVal;
            continue;
        }

        dotNotation(key + '.' + i, object[i], parentObject);
    }
}


// *****************************************************************************
// Process arguments
// *****************************************************************************

// collect keys
var keys = [];
for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i].match(/^--?\D/)) {
        keys.push(process.argv[i].replace(/^--?/, ""));
    }
}
// all the arguments should be trated as strings in the initial parsing
var argv = optimist
    .string(keys)
    .argv;

// an empty descriptor
var descriptor = {};
// the computed descriptor file path
var descriptorPath = process.cwd() + '/' + (argv['_'][0] || DEFAULT_DESCRIPTOR_PATH);

// load the descriptor file
if (fs.existsSync(descriptorPath)) {
    try {
        descriptor = require(descriptorPath);
    } catch (err) {
        console.error('Invalid deployment descriptor file: ' + descriptorPath);
        process.exit(1);
    }
} else {
    if (argv['_'][0]) {
        console.error('No such deployment descriptor file: ' + descriptorPath);
        process.exit(2);
    }
}

for (var i in descriptor) {
    var object = descriptor[i];
    if (typeof object === 'object') {
        var dotn = dotNotation(i, object, descriptor);
        delete descriptor[i];
    }
}

delete argv['_'];
delete argv['$0'];

var aliases = {
    'h': 'host',
    'p': 'port',
    'u': 'user',
    'o': 'overwrite',
    'd': 'path',
    'r': 'repo',
    's': 'script'
}
var descriptions = {
    'host': 'the host name of the server to which the deployment is made',
    'port': 'the port on which the server should listen',
    'user': 'the user name form which the deployment is made on the host',
    'path': 'the path on the server where the deployment will be made',
    'overwrite': 'if the deployment should overwrite (remove) path if this already exists',
    'repo': 'the URL of the repository from where to fetch the code',
    'script': 'the path of the script that should be run for this deployment relative to the path option'
}

// overwriting the descriptor options
for (var i in argv) {
    var longi = aliases[i] || i;
    descriptor[longi] = argv[i];
}

// gather all the options
argv = process.argv.slice(0, 2);

for (var i in descriptor) {
    var key = '--' + i;
    var val;

    switch (typeof descriptor[i]) {
        case 'object':
            var newObj = {};
            dotNotation(i, descriptor[i], newObj);
            for (var j in newObj) {
                argv.push('--' + j);
                argv.push(newObj[j].toString());
            }
            continue;
        default:
            val = descriptor[i].toString();
    }
    argv.push(key);
    argv.push(val);
}


// overwrite the process arguments
process.argv = argv;

// parse again the arguments now with restrictions
argv = optimist(argv)
    // usage and desctiptions
    .usage('Usage:\n' +
        '  gotowork [options] [descriptor.json]\n\n' +
        '  If no deployment descriptor is provided, a file named deployment.json will be\n' +
        '  searched for in the current directory. If deployment.json is not found, all\n' +
        '  the mandatory deployment properties must be provided as options.'
    )
    .alias(aliases)
    .describe(descriptions)
    .demand(['host', 'user', 'repo', 'script'])
    // types
    .string(['host', 'user', 'path', 'repo', 'script'])
    .boolean('overwrite')
    // defaults
    .default('port', 80)
    .default('path', '~')
    .default('overwrite', false)

    .check(validate)
    .argv;

delete argv['_'];
delete argv['$0'];

// remove the short aliases
for (var i in aliases) {
    delete argv[i];
}


// *****************************************************************************
// Deploy
// *****************************************************************************

var spawn = require('child_process').spawn;

var userHost = argv.user + '@' + argv.host;
console.log('Connecting to ' + userHost + ' ...');

var env = '';
for (var i in argv.env) {
    env += i + '="' + argv.env[i] + '" ';
}
if (env) {
    delete argv.env;
}
for (var i in argv) {
    env += 'DEPLOY_' + i.toUpperCase() + '="' + argv[i] + '" ';
}

var ssh = spawn('ssh', ['-A', userHost, env + ' bash -s' ], { stdio: 'inherit' });

ssh.on('exit', function (code) {
    if (!code) {
        console.log('Deployment done');
    } else {
        console.log('Deployment finished with error code: ' + code);
    }
});


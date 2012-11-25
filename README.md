gotowork
========

gototwork is a simple node.js library that reads a deployment script from stdin
and starts it on a remote machine passing it deployment properties as
environment variable read either from a descriptor file or from the command line
option arguments.

Currently, gotowork assumes your code is in a repository and the deployment
needs to be made on a UNIX-based server to which you can connect using SSH.
This imposes some mandatory deployment properties: host, user, repo, path.

The "env" deployment descriptor properties receive special treatment as the keys
inside will be interpreted and passed directly as environment variables. All the
other keys in the JSON descriptor will be uppercase and prefixed with "DEPLOY_".

Passing environment variable from the command line must follow the dot notation:

``` bash
$ gotowork --env.VAR1 value_of_var_one
```

## Installation

``` bash
$ [sudo] npm install gotowork -g
```

## Usage

```
  gotowork [options] [descriptor.json]

  If no deployment descriptor is provided, a file named deployment.json will be
  searched for in the current directory. If deployment.json is not found, all
  the mandatory deployment properties must be provided as options.

Options:
  --host, -h       the host name of the server to which the deployment is made              [string]  [required]
  --port, -p       the port on which the server should listen                               [default: 80]
  --user, -u       the user name form which the deployment is made on the host              [string]  [required]
  --path, -d       the path on the server where the deployment will be made                 [string]  [default: "~"]
  --force, -f      the deployment should overwrite (remove) path if this already exists     [boolean]  [default: false]
  --repo, -r       the URL of the repository from where to fetch the code                   [string]  [required]
```

## Examples

To make a deployment having a `descriptor.json` in the current working directory,
you only need to provide a deployment script:

``` bash
$ gotowork < my_deployment.sh
```

If the deployment descriptor is called other than `descriptor.json` or is in another
location than the current working directory just provide it as argument to gotowork:

``` bash
$ gotowork my_descriptor.json < my_deployment.sh
```

If you want to overwrite some of the options in the descriptor file, just provide
them as options:

``` bash
$ gotowork --server dev.example.com my_descriptor.json < my_deployment.sh
```

Maybe you want to make an test deployment of a feature in another repo:

``` bash
$ gotowork --repo my_new_feature_repo --port 8081 my_descriptor.json < my_deployment.sh
```

## Options

The options provided in the command line will be processed using the [substack/optimist]
module.

For the predefined arguments (shown in the usage section) there are also aliases that
will be expanded to the long name options before being passed to the deployment script.

## Deployment script

The most challenging part is to perform the actions on the server. And it's up to you
what you want to do on the server. That's why you MUST provide a
deployment script. This module only makes sure the script gets the input data.

Currently the descriptor data is passed only as environment variables. All keys of the
descriptor are passed as `DEPLOY_*` variables, where the value of the key will be
transformed to uppercase. For example, the `host` key will generate a `DEPLOY_HOST`
variable.


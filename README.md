gotowork
========

Gototwork is a simple node.js library that starts a remote deployment script.
Currently, gotowork assumes your code is in a repository and the deployment
needs to be made on a UNIX-based server to which you can connect to using SSH.

Gotowork will read a JSON deployment descriptor file, wlll overwrite it's keys
with the ones provided to in the command line and will start a remote SSH
session to which it will also send a deployment script.

## Installation

``` bash
  $ [sudo] npm install gotowork -g
```

## Usage

```
Usage:
  gotowork [options] [descriptor.json]

  If no deployment descriptor is provided, a file named deployment.json will be
  searched for in the current directory. If deployment.json is not found, all
  the mandatory deployment properties must be provided as options.

Options:
  --host, -h       the host name of the server to which the deployment is made                                [string]  [required]
  --port, -p       the port on which the server should listen                                                 [default: 80]
  --user, -u       the user name form which the deployment is made on the host                                [string]  [required]
  --path, -d       the path on the server where the deployment will be made                                   [string]  [default: "~"]
  --overwrite, -o  if the deployment should overwrite (remove) path if this already exists                    [boolean]  [default: false]
  --repo, -r       the URL of the repository from where to fetch the code                                     [string]  [required]
  --script, -s     the path of the script that should be run for this deployment relative to the path option  [string]  [required]
```

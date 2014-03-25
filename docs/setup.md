# Prerequisites
Dependencies :

  * [Node.JS](http://nodejs.org), tested on 0.10 (stable branch)
  * [MongoDB](http://mongodb.org), tested on 2.2 and 2.4

Optional dependencies :

  * [collectd](http://collectd.org), tested on 5.1

# MongoDB hosts requirements

Partitions containing MongoDB data should be at least ext4 (or file systems suited for big files) mounted with `noatime` option for performance reasons.
MongoDB has only be tested and benched on local storage, considering the literature, we **don't** think remote storage should be used.

To make sure of this, edit the file `/etc/fstab` and check the mounting point of your MongoDB data partition contains both the mentions `ext4` as type, and `noatime` as options.

# Global configuration for all nodes containing applications

On all the hosts running a collector, an evaluator, an API or a static server, the environment variable NODE_ENV must be set to `production` **prior** to any execution.
Do :

```Shell
export NODE_ENV=production
```

The collector and the evaluator are scaled from the inside, so any instance of them will spawn, by default, as many processes as available CPU cores. This is a standard way in the Node.JS's world to achieve the best possible performance, Node.JS being mono-threaded by design.

# Collector configuration
The collector is located in the folder `./collector` from the root of the project, all paths in this chapter will be relative to this.

It collects data in JSON format on a dedicated server. This is is essentially a wrapper around [Cube collector](https://github.com/square/cube/wiki/Collector) which supports collectd output easily. The wrapper makes it scale, but with some slight differences with original cube :

  * UDP endpoint is deactivated
  * It is possible to remap any collectd event before inserting value in database. Some helpers are already provided to make SNMP and some collectd event in the same format, and some re-mapper are there just to simplify the request you would have to do for your widgets.
  * A programmatic configuration, enabling support for different environments, and overridable configurations through environment variables.

## Configuration file
Collectors configuration is located in `./bin/config.js`, the file contains several parts, the global, and the per-environment definitions.
The only part needing modification for a production setup is the database connection prefixed by `mongo-`, namely `mongo-host`, `mongo-port`, `mongo-database`, `mongo-username` and `mongo-password`.
The collector will listen on the port defined on the `http-port` setting.

You can edit the default settings, but the preferred way is to edit the production section at the end of the file, such as the following :

```Javascript
cfg.env('production', function() {
  cfg.get('collector')["http-port"] = 12345;
  cfg.get('collector')["mongo-username"] = "myuser";
  cfg.get('collector')["mongo-password"] = "mypassword";
  ...
});
```

# collectd
Even if you can send data in a custom way, using collectd should be the standard way to provide data concerning machines to monitor.

Pick your favorite editor and change the file `/etc/collectd/collectd.conf`.

collectd should be configured with the `Write HTTP Plugin` with the following lines :

```
LoadPlugin write_http
<Plugin write_http>
  <URL "http://server:1080/collectd">
    Format "JSON"
    StoreRates true
  </URL>
</Plugin>
```

The URL should target the machine, or ideally a load balancer, on the collector's port, ending with `collectd` as path.

## Limitations
By the distributed nature of the system, `DERIVE` values coming from collectd will produce unexpected results and **must be avoided**.

# Evaluator configuration

The evaluator is located in the folder `./evaluator` from the root of the project, all paths in this chapter will be relative to this.

## Configuration file
The configuration principle is the same as the collector, so please refer to this.

# API server configuration

The API server is located in the folder `./admin/api` from the root of the project, all paths in this chapter will be relative to this.

## Configuration file
The API server configuration is contained into `./lib/config.js`.

Like the collector, this file contains sections dedicated to different environments at the bottom, examples are already provided to override settings in it.
Each kind of data has its own connection settings since it might be desirable in the future to separate it to different instances of MongoDB.
You can also adjust connections pools there, though you should carefully modify this since we picked good defaults that should fit the use of the application.
By default, we consider the API server to have an instance of the evaluator on the same machine, if that's not the case, you should override the `evaluator` settings that are targeting localhost.

# Static server configuration

The static server is located in the folder `./admin/static` from the root of the project, all paths in this chapter will be relative to this.

## Configuration file
By default, we did not include configuration file for the static server itself, so it will be listening on the port 8081 on all the IPv4 interfaces.
Addressing this issue will be considered in the future if there is a need for it, since we considered these servers will always be behind a load balancer.

## Browser configuration file
Edit the file `./config/production.js` and look for those 2 parameters :

* `apiUrl` : it should be the url to the API server
* `wsUrl` : it should also be the url to the API server, but the port must be specified. This is a separated parameter in case you have a different reverse proxy to hit the API server, since WebSockets will be used in the best case.

# Build
Dependencies are retrieved by the built-in Node.JS tool, `NPM`, which should come with Node.JS installation.
At the root of the projects execute :

```Shell
npm install
```

It should recursively download and install all dependencies automatically.

To follow web best practices, we "build" the website before serving it to the client. To do that, execute :

```Shell
npm run-script build
```

This command also makes use of the `NODE_ENV` variable, so make sure it is correctly set before.

# Run
Now to run the project, go back to its root, and execute :
`npm start`

Beekeeper uses a program called `forever` which is a process watcher, it will ensure that they keep running. You have a few other commands accessible from command line :

|Command                      |Effect                                                           |
|-----------------------------|-----------------------------------------------------------------|
|`npm start`                  |starts all the parts of Beekeeper                                |
|`npm stop`                   |stops all the parts of Beekeeper                                 |
|`npm run-script restartall`  |restarts all the parts of Beekeeper                              |
|`npm run-script list`        |list the running processes of Beekeeper                          |
|`npm run-script logs`        |shows a list of the current technical log files                  |
|`npm run-script bktrace`     |shows all application business logs                              |
|`npm run-script bkdebug`     |shows application business logs of at least `debug` level        |
|`npm run-script bklog`       |shows application business logs of at least `log` level          |
|`npm run-script bkinfo`      |shows application business logs of at least `info` level         |

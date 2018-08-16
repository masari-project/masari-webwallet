# How to compile & Deploy
The project is using Typescript as main language and not other dependencies on external libraries (everything is already included).

# Compilation
The first step will be to compile the typescript code into javascript code so browsers will be able to understand it. 
You also need to build some files that are dynamically generated like the manifest ...
This task is doable with :
```
npm install
nodejs ./node_modules/typescript/bin/tsc --project tsconfig.prod.json
nodejs build.js
```
The first task install dependencies (typescript) and the text one compile the typescript code.
We are using a custom tsconfig file which is optimized for production.

# Change configuration
You will have to edit the file src/config.js in order to change the API endpoint. 
The default value use the same domain appended by /api/

That's all

# Deploy
All the content of the src directory needs to be exposed with a web-server.
You will also need to expose the content of the src_api content to an endpoint which can interpret PHP.
By default the configuration looks at domainname.com/api/


# Permissions
The API stores precomputed data for performances in a directory called cache/ in the same directory of the API code (PHP code).
You will need to create this directory with the write permissions.

# Cron task / Process
Precomputed data are build by another process. This process will call the Masari daemon and compute blocks into chunks of blocks to reduce network latency.
In order to do so, you will need to run the file blockchain.php with an environment variable "export=true". 
This file will shut down after 1h, and has a anti-concurrency mechanism built in.

One way to handle this is by running a cron task each minute with something like:
```
* * * * * root cd /var/www/domain.com/api && export generate=true && php blockchain.php
```
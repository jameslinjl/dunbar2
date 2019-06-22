# dunbar server

This is the source code for the server that powers much of dunbar automation.

In order to run locally, you will need to have the correct env vars set.

The env vars you need can be found in config/env_var_conf.template, but without any values.

You need to ask James to get the production values (or you can get them youself from the Heroku dashboard if you have access).

Once you have a file with the env vars (let's say it is called env_var_conf), then you can just run the following to start the server:
```
npm install
source env_var_conf && npm start
```
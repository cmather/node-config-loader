config-loader
==========================================

A config file loader for webpack.

Given a config file like this:

`./config/environments/development.config.json`

Which contains this content:

```json
{
  "extends": "./base.config.json",

  "web": {
    webConfigVariable: "some value"
  },

  "node": {
    "nodeConfigVariable": "node only config variable",
    "database": "<%= process.env['DATABASE'] %>"
  }
}
```

And a webpack config that uses this loader to process config files:

```javascript
{
  target: 'web',
  module: {
    rules: [
      {
        test: /\.config\.json$/,
        use: [{
          loader: 'json-loader'
        }, {
          loader: '@cmather/config-loader',
          options: {
            target: 'web' // or 'node'
          }
        }]
      }
    ]
  }
}
```

When you run webpack it will build the config values into the bundle for the
given target. This prevents server config variables from ending up in the
browser. And it compiled the config json with ejs which allows us to use
environment variables in the config.

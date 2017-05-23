const fs    = require('fs');
const path  = require('path');
const utils = require('loader-utils');
const ejs   = require('ejs');
const debug = require('debug')('config-loader');

/**
 * Given a config source file, first compile it using ejs so that any <%= ... %>
 * tags are interpolated with actual values. Then, JSON.parse the result of that
 * and grab only the config for the given environment (e.g. node, web). Finally,
 * return the JSON stringified result for the given target.
 */
module.exports = function(source) {
  const options = utils.getOptions(this);
  options.target = options.target || 'web';
  const modulePath = this.context;

  /**
   * Given a raw config source file as a string, returns the config object for a
   * given target (e.g. web, node).
   */
  function parse(source) {
    const compiled = ejs.render(source);
    const config = JSON.parse(compiled);
    const result = config[options.target];
    if (config.extends) {
      result.extends = config.extends;
    }

    return result;
  }

  /**
   * Reads a config filepath and returns the parsed result.
   */
  function read(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`config file not found: ${filepath}`);
    }

    // read the file, parse it and return the config object.
    return parse(fs.readFileSync(filepath, 'utf8'));
  }

  /**
   * JSON stringify an object.
   */
  function stringify(object) {
    return JSON.stringify(object, null, '  ');
  }

  const stack = [];
  let config = parse(source);
  stack.push(config);

  while (config.extends) {
    debug('parsing extends: %s', config.extends);
    let filepath = path.join(modulePath, config.extends);
    delete config.extends;
    config = read(filepath);
    stack.push(config);
  }

  /**
   * Now from the top of the stack down to the bottom, create the final config
   * object. So children configs override parent configs.
   */
  const result = {};
  while (config = stack.pop()) {
    Object.assign(result, config);
  }

  debug('final config: %j', result);
  return stringify(result);
};

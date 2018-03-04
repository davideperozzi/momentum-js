goog.provide('momentumdebug.ScriptLoader');

/**
 * @constructor
 * @param {string} id
 * @param {string=} optSrc
 */
momentumdebug.ScriptLoader = function(id, optSrc)
{
  /**
   * @public
   * @type {string}
   */
  this.id = id;

  /**
   * @public
   * @type {string}
   */
  this.src = optSrc || '';

  /**
   * @public
   * @type {boolean}
   */
  this.loaded = false;

  /**
   * @public
   * @type {boolean}
   */
  this.loading = false;

  /**
   * @private
   * @type {Array<Function>}
   */
  this.completeCallbacks_ = [];

  /**
   * @private
   * @type {Element}
   */
  this.element_ = document.createElement('script');

  /**
   * @private
   * @type {Element}
   */
  this.target_ = document.body;
};

/**
 * @public
 * @return {momentumdebug.ScriptLoader}
 */
momentumdebug.ScriptLoader.prototype.load = function()
{
  if ( ! this.loading && ! this.loaded) {
    this.loading = true;
    this.element_.onload = this.handleComplete_.bind(this);
    this.element_.src = this.src;

    this.target_.appendChild(this.element_);
  }

  return this;
};

/**
 * @private
 */
momentumdebug.ScriptLoader.prototype.handleComplete_ = function()
{
  this.loaded = true;

  for (var i = 0, len = this.completeCallbacks_.length; i < len; i++) {
    this.completeCallbacks_[i]();
  }
};

/**
 * @public
 * @param {Function} callback
 * @param {Object=} optCtx
 */
momentumdebug.ScriptLoader.prototype.onComplete = function(callback, optCtx)
{
  if (optCtx) {
    callback = goog.bind(callback, optCtx);
  }

  this.completeCallbacks_.push(callback);
};

/**
 * @type {Object}
 */
momentumdebug.ScriptLoader.Instances = {};

/**
 * @public
 * @param {string} id
 * @param {string=} optSrc
 * @return {momentumdebug.ScriptLoader}
 */
momentumdebug.ScriptLoader.create = function(id, optSrc)
{
  if ( ! momentumdebug.ScriptLoader.Instances.hasOwnProperty(id)) {
    momentumdebug.ScriptLoader.Instances[id] = new momentumdebug.ScriptLoader(id, optSrc);
  }

  return momentumdebug.ScriptLoader.Instances[id];
};
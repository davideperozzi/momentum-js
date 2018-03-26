goog.provide('momentum.HandlerComponent');

/**
 * @constructor
 */
momentum.HandlerComponent = function()
{
  /**
   * @private
   * @type {Array<Function>}
   */
  this.handlerChangeCallbacks_ = [];
};

/**
 * @export
 * @return {momentum.Handler}
 */
momentum.HandlerComponent.prototype.getHandler = function()
{
  return goog.abstractMethod();
};

/**
 * @export
 * @param {Function} callback
 */
momentum.HandlerComponent.prototype.onHandlerChange = function(callback)
{
  this.handlerChangeCallbacks_.push(callback);
};

/**
 * @protected
 */
momentum.HandlerComponent.prototype.handlerChanged = function()
{
  for (var i = 0, len = this.handlerChangeCallbacks_.length; i < len; i++) {
    this.handlerChangeCallbacks_[i](this.getHandler());
  }
};
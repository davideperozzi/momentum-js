goog.provide('momentum.Rotatable');

// momentum
goog.require('momentum.Handler');
goog.require('momentum.utils')

/**
 * @constructor
 * @param {Element} element
 */
momentum.Rotatable = function(element) {
	/**
	 * @private
	 * @type {Element}
	 */
	this.element_ = element;

	/**
   * @private
   * @type {ClientRect}
   */
  this.elementBounds_ = this.element_.getBoundingClientRect();

	/**
	 * @private
	 * @type {momentum.Handler}
	 */
	this.handler_ = null;

	/**
   * @private
   * @type {number}
   */
  this.lastRotation_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.startRotation_ = 0;

	/**
	 * Init rotatable
	 */
	this.init_();
};

/**
 * @private
 */
momentum.Rotatable.prototype.init_ = function() {
	this.handler_ = new momentum.Handler(this.element_.parentElement);
	this.handler_.onDown(this.handleDown_, this);
	this.handler_.onMove(this.handleMove_, this);
	this.handler_.init();
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @return {number}
 */
momentum.Rotatable.prototype.getRotationDegree_ = function(x, y, r) {
  return 180 - Math.atan2(x - r, y - r) * (180 / Math.PI);
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
momentum.Rotatable.prototype.handleDown_ = function(x, y) {
  var rotation = this.getRotationDegree_(x, y, this.elementBounds_.width / 2);

	this.startRotation_ = rotation - this.lastRotation_;

	return true;
};	

/**
 * @private
 * @param {number} x
 * @param {number} y
 */
momentum.Rotatable.prototype.handleMove_ = function(x, y) {
  var rotation = this.getRotationDegree_(x, y, this.elementBounds_.width / 2);

  this.lastRotation_ = rotation - this.startRotation_;
  this.lastRotation_ %= 360;

  momentum.utils.setStyle(this.element_, 'transform', 'rotate(' + this.lastRotation_ + 'deg)');
};
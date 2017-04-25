goog.provide('momentum.Rotatable');

// momentum
goog.require('momentum.Handler');

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
	this.handler_.setFriction(0.015);
	this.handler_.setMaxVelocity(500);
	this.handler_.init();
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
momentum.Rotatable.prototype.handleDown_ = function(x, y) {
	rotPosX = x - this.elementBounds_.left - this.elementBounds_.width / 2;
	rotPosY = y - this.elementBounds_.top - this.elementBounds_.width / 2;

	this.startRotation_ = 180 - this.lastRotation_ - Math.atan2(rotPosX, rotPosY) * (180 / Math.PI);

	return true;
};	

/**
 * @private
 * @param {number} posX
 * @param {number} posY
 * @param {number} velX
 * @param {number} velY
 */
momentum.Rotatable.prototype.handleMove_ = function(posX, posY, velX, velY) {
	rotPosX = posX - this.elementBounds_.left - this.elementBounds_.width / 2;
	rotPosY = posY - this.elementBounds_.top - this.elementBounds_.width / 2;

	this.lastRotation_ = 180 - this.startRotation_ - Math.atan2(rotPosX, rotPosY) * (180 / Math.PI);

	this.element_.style.transform = "rotate(" + this.lastRotation_ + "deg)";
};
goog.provide('momentum.Coordinate');

/**
 * @struct
 * @constructor
 * @param {number=} optX
 * @param {number=} optY
 */
momentum.Coordinate = function(optX, optY) {
  /**
   * @public
   * @type {number}
   */
  this.x = optX || 0;

  /**
   * @public
   * @type {number}
   */
  this.y = optY || 0;
};

/**
 * @public
 * @return {momentum.Coordinate}
 */
momentum.Coordinate.prototype.clone = function() {
  return new momentum.Coordinate(this.x, this.y);
};

/**
 * @public
 */
momentum.Coordinate.prototype.clamp = function(min, max) {
  this.clampX(min, max);
  this.clampY(min, max);
};

/**
 * @public
 */
momentum.Coordinate.prototype.clampX = function(min, max) {
  this.x = Math.min(Math.max(this.x, min), max);
};

/**
 * @public
 */
momentum.Coordinate.prototype.clampY = function(min, max) {
  this.y = Math.min(Math.max(this.y, min), max);
};
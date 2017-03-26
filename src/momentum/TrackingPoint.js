goog.provide('momentum.TrackingPoint');

// momentum
goog.require('momentum.Coordinate');

/**
 * @struct
 * @constructor
 * @param {momentum.Coordinate} position
 */
momentum.TrackingPoint = function(position) {
  /**
   * @public
   * @type {momentum.Coordinate}
   */
  this.position = position;

  /**
   * @public
   * @type {number}
   */
  this.timestamp = Date.now();
};
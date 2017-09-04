goog.provide('momentum.Handler');

// momentum
goog.require('momentum.Coordinate');
goog.require('momentum.TrackingPoint');
goog.require('momentum.utils');

/**
 * @constructor
 * @param {Element=} optTarget
 */
momentum.Handler = function(optTarget) {
  /**
   * @private
   * @type {Element}
   */
  this.target_ = optTarget || document.documentElement;

  /**
   * @private
   * @type {ClientRect}
   */
  this.targetBounds_ = this.target_.getBoundingClientRect();

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.position_ = new momentum.Coordinate();

  /**
   * @private
   * @type {Array<momentum.TrackingPoint>}
   */
  this.trackingPoints_ = [];

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.startPosition_ = new momentum.Coordinate();

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.lastPosition_ = new momentum.Coordinate();

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.lastVelocity_ = new momentum.Coordinate();

  /**
   * @private
   * @type {Object}
   */
  this.boundOverflow_ = new momentum.Coordinate();

  /**
   * @private
   * @type {{
   *     minX: number,
   *     maxX: number,
   *     minY: number,
   *     maxY: number
   * }}
   */
  this.bounds_ = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0
  };

  /**
   * @private
   * @type {boolean}
   */
  this.animationsStopped_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.hasBounds_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.hasBoundsX_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.hasBoundsY_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.dragging_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.allowDecelerating_ = false;

  /**
   * @private
   * @type {boolean}
   */
  this.decelerating_ = false;

  /**
   * @private
   * @type {number}
   */
  this.resetTimerId_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.startTime_ = 0;

  /**
   * @private
   * @type {Array<!Function>}
   */
  this.moveCallbacks_ = [];

  /**
   * @private
   * @type {Array<Function>}
   */
  this.upCallbacks_ = [];

  /**
   * @private
   * @type {Function}
   */
  this.downCallback_ = null;

  /**
   * @private
   * @type {number}
   */
  this.precision_ = 3;

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.friction_ = new momentum.Coordinate(0.035, 0.035);

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.activeOffsetFriction_ = new momentum.Coordinate(0, 0);

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.offsetFriction_ = new momentum.Coordinate(0.1, 0.1);

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.restitution_ = new momentum.Coordinate(0, 0);

  /**
   * @private
   * @type {number}
   */
  this.threshold_ = 5;

  /**
   * @private
   * @type {number}
   */
  this.resetMs_ = 50;

  /**
   * @private
   * @type {number}
   */
  this.maxVelocity_ = 70;

  /**
   * @private
   * @type {Object}
   */
  this.currentListenerMap_ = {};

  /**
   * @private
   * @type {Object}
   */
  this.listenerOptions_ = {
    'passive': false,
    'useCapture': false
  };
};

/**
 * @export
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Handler.prototype.onMove = function(callback, optCtx) {
  this.moveCallbacks_.push(callback.bind(optCtx || this));
};

/**
 * @export
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Handler.prototype.onDown = function(callback, optCtx) {
  this.downCallback_ = callback.bind(optCtx || this);
};


/**
 * @export
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Handler.prototype.onUp = function(callback, optCtx) {
  this.upCallbacks_.push(callback.bind(optCtx || this));
};

/**
 * @export
 * @param {number} friction
 */
momentum.Handler.prototype.setFriction = function(friction) {
  this.friction_.x = this.friction_.y = friction;
  this.friction_.clamp(0, 1);
};

/**
 * @export
 * @param {number} friction
 */
momentum.Handler.prototype.setOffsetFriction = function(friction) {
  this.offsetFriction_.x = this.offsetFriction_.y = friction;
  this.offsetFriction_.clamp(0, 1);
};

/**
 * @export
 * @param {number} threshold
 */
momentum.Handler.prototype.setThreshold = function(threshold) {
  this.threshold_ = threshold;
};

/**
 * @export
 * @param {number} restitution
 */
momentum.Handler.prototype.setRestitution = function(restitution) {
  this.restitution_.x = this.restitution_.y = restitution;
  this.restitution_.clamp(-1, 1);
};

/**
 * @export
 * @param {number} maxVelocity
 */
momentum.Handler.prototype.setMaxVelocity = function(maxVelocity) {
  this.maxVelocity_ = Math.max(maxVelocity, 0);
};

/**
 * @export
 * @return {momentum.Coordinate}
 */
momentum.Handler.prototype.getFriction = function() {
  return this.friction_;
};

/**
 * @export
 * @return {number}
 */
momentum.Handler.prototype.getThreshold = function() {
  return this.threshold_;
};

/**
 * @export
 * @return {momentum.Coordinate}
 */
momentum.Handler.prototype.getRestitution = function() {
  return this.restitution_;
};

/**
 * @export
 * @return {number}
 */
momentum.Handler.prototype.getMaxVelocity = function() {
  return this.maxVelocity_;
};

/**
 * @export
 * @return {Element}
 */
momentum.Handler.prototype.getTarget = function() {
  return this.target_;
};

/**
 * @export
 * @param {boolean=} optUpdate
 * @return {ClientRect}
 */
momentum.Handler.prototype.getTargetBounds = function(optUpdate) {
  if (optUpdate) {
    this.targetBounds_ = this.target_.getBoundingClientRect();
  }

  return this.targetBounds_;
};

/**
 * @export
 * @param {number} x
 * @param {number} y
 * @param {boolean=} optReset
 */
momentum.Handler.prototype.setPosition = function(x, y, optReset) {
  this.position_.x = x;
  this.position_.y = y;

  if (optReset) {
    this.lastPosition_.x = x;
    this.lastPosition_.y = y;

    if (this.decelerating_) {
      this.lastVelocity_.x = 0;
      this.lastVelocity_.y = 0;
    }
  }
};

/**
 * @export
 * @suppress {checkTypes}
 */
momentum.Handler.prototype.init = function() {
  if ('ontouchstart' in window || navigator.msMaxTouchPoints) {
    this.currentListenerMap_ = {
      'touchend': {
        'target': this.target_,
        'listener': this.handleUserUp_.bind(this)
      },
      'touchcancel': {
        'target': this.target_,
        'listener': this.handleUserUp_.bind(this)
      },
      'touchstart': {
        'target': this.target_,
        'listener': this.handleUserDown_.bind(this)
      },
      'touchmove': {
        'target': this.target_,
        'listener': this.handleUserMove_.bind(this)
      }
    };
  } else {
    this.currentListenerMap_ = {
      'mouseup': {
        'target': this.target_,
        'listener': this.handleUserUp_.bind(this)
      },
      'mouseleave': {
        'target': this.target_,
        'listener': this.handleUserUp_.bind(this)
      },
      'mousedown': {
        'target': this.target_,
        'listener': this.handleUserDown_.bind(this)
      },
      'mousemove': {
        'target': this.target_,
        'listener': this.handleUserMove_.bind(this)
      }
    };
  }

  this.currentListenerMap_['scroll'] = {
    'target': window,
    'listener': this.update.bind(this)
  };

  this.applyListenerMap_();
};

/**
 * @public
 * @export
 */
momentum.Handler.prototype.destroy = function()
{
  this.removeListenerMap_();
  this.stop();
};

/**
 * @public
 * @export
 */
momentum.Handler.prototype.stop = function()
{
  this.animationsStopped_ = true;
  this.allowDecelerating_ = false;
};

/**
 * @public
 * @export
 */
momentum.Handler.prototype.start = function()
{
  this.animationsStopped_ = false;
  this.allowDecelerating_ = true;
};

/**
 * @export
 * @param {number=} optMinX
 * @param {number=} optMaxX
 * @param {number=} optMinY
 * @param {number=} optMaxY
 */
momentum.Handler.prototype.setBounds = function(optMinX, optMaxX, optMinY, optMaxY) {
  this.bounds_.minX = optMinX || 0;
  this.bounds_.maxX = optMaxX || 0;
  this.bounds_.minY = optMinY || 0;
  this.bounds_.maxY = optMaxY || 0;

  this.hasBoundsX_ = this.bounds_.minX != 0 || this.bounds_.maxX != 0;
  this.hasBoundsY_ = this.bounds_.minY != 0 || this.bounds_.maxY != 0;
  this.hasBounds_ = this.hasBoundsX_ || this.hasBoundsY_;
};

/**
 * @export
 */
momentum.Handler.prototype.update = function() {
  this.targetBounds_ = this.target_.getBoundingClientRect();
  this.positionUpdated_();
};

/**
 * @public
 * @param {Element} element
 * @return {momentum.Coordinate}
 */
momentum.Handler.prototype.getRelativeElementPosition = function(element) {
  var bounds = element.getBoundingClientRect();

  return new momentum.Coordinate(
    bounds.left - this.targetBounds_.left,
    bounds.top - this.targetBounds_.top
  );
};

/**
 * @private
 */
momentum.Handler.prototype.applyListenerMap_ = function()
{
  for (var type in this.currentListenerMap_) {
    var target = this.currentListenerMap_[type]['target'];

    target.addEventListener(
      type,
      this.currentListenerMap_[type]['listener'],
      this.listenerOptions_
    );
  }
};

/**
 * @private
 */
momentum.Handler.prototype.removeListenerMap_ = function()
{
  for (var type in this.currentListenerMap_) {
    var target = this.currentListenerMap_[type]['target'];

    target.removeEventListener(
      type,
      this.currentListenerMap_[type]['listener'],
      this.listenerOptions_
    );
  }

  this.currentListenerMap_ = {};
};

/**
 * @param {Event} event
 * @return {momentum.Coordinate}
 */
momentum.Handler.prototype.getEventPosition_ = function(event) {
  var position = new momentum.Coordinate();

  if (event.touches) {
    position.x = event.touches[0].clientX - this.targetBounds_.left;
    position.y = event.touches[0].clientY - this.targetBounds_.top;
  } else {
    position.x = event.clientX - this.targetBounds_.left;
    position.y = event.clientY - this.targetBounds_.top;
  }

  return position;
};

/**
 * @private
 * @param {Event} event
 */
momentum.Handler.prototype.handleUserDown_ = function(event) {
  var position = this.getEventPosition_(event);

  if (this.downCallback_ && !this.downCallback_(position.x, position.y)) {
    return;
  }

  this.dragging_ = true;
  this.allowDecelerating_ = false;

  // Set initial start values
  this.startPosition_.x = this.position_.x = position.x;
  this.startPosition_.y = this.position_.y = position.y;
  this.startTime_ = Date.now();

  // Reset velocity
  this.lastVelocity_.x = 0;
  this.lastVelocity_.y = 0;

  this.positionUpdated_();
  this.collectTrackingPoints_();
};

/**
 * @private
 */
momentum.Handler.prototype.collectTrackingPoints_ = function() {
  this.addTrackingPoint_();
  this.updateTrackingPoints_();

  if (this.dragging_) {
    this.requestAnimationFrame_(this.collectTrackingPoints_, this);
  }
};

/**
 * @private
 */
momentum.Handler.prototype.addTrackingPoint_ = function() {
  this.trackingPoints_.push(
    new momentum.TrackingPoint(this.position_.clone())
  );
};

/**
 * @private
 * @param {Event} event
 */
momentum.Handler.prototype.handleUserMove_ = function(event) {
  if (this.dragging_) {
    event.preventDefault();
    event.stopPropagation();

    var position = this.getEventPosition_(event);

    this.position_.x = position.x;
    this.position_.y = position.y;

    this.positionUpdated_();
  }
};

/**
 * @private
 */
momentum.Handler.prototype.updateTrackingPoints_ = function() {
  var timestamp = Date.now();
  var removeIndicies = [];

  for (var i = 0, len = this.trackingPoints_.length; i < len; i++) {
    if (timestamp - this.trackingPoints_[i].timestamp >= this.resetMs_) {
      removeIndicies.push(i);
    }
  }

  for (var i = 0, len = removeIndicies.length; i < len; i++) {
    this.trackingPoints_.splice(removeIndicies[i], 1);
  }

  if (this.trackingPoints_.length > 0) {
    var lastTrackingPoint = this.trackingPoints_[0];

    this.startPosition_ = lastTrackingPoint.position;
    this.startTime_ = lastTrackingPoint.timestamp;
  }
};

/**
 * @private
 * @param {Event} event
 */
momentum.Handler.prototype.handleUserUp_ = function(event) {
  if (this.dragging_) {
    this.dragging_ = false;
    this.allowDecelerating_ = true;

    // Calculate the velocity the object reached before the user
    // released the trigger. Depending on the start time.
    var timeDelta = (Date.now() - this.startTime_) / 15;

    this.lastVelocity_.x = (this.position_.x - this.startPosition_.x) / timeDelta;
    this.lastVelocity_.y = (this.position_.y - this.startPosition_.y) / timeDelta;

    // Clamp velocities to the max value
    this.lastVelocity_.clamp(-this.maxVelocity_, this.maxVelocity_);

    // Clear the start proeprties, so they won't mess up any
    // further calculations
    this.clearStartProperties_();

    // Clear previous tracking points. At this point all calculations which
    // are including the tracking points should be already made.
    this.trackingPoints_ = [];

    // Check if the velocity is greater than the threshold to enable
    // the decelerating from the calculated velocity
    if (Math.abs(this.lastVelocity_.x) >= this.threshold_ ||
      Math.abs(this.lastVelocity_.y) >= this.threshold_ ||
      this.boundOverflow_.x != 0 ||
      this.boundOverflow_.y != 0) {
      this.decelerate_();
    }

    // Call up callbacks
    for (var i = 0, len = this.upCallbacks_.length; i < len; i++) {
      this.upCallbacks_[i]();
    }
  }
};

/**
 * @private
 */
momentum.Handler.prototype.clearStartProperties_ = function() {
  this.startPosition_.x = 0;
  this.startPosition_.y = 0;
  this.startTime_ = 0;
};

/**
 * @private
 */
momentum.Handler.prototype.applyBounds_ = function() {
  if (this.hasBounds_) {
    if (this.hasBoundsX_) {
      if (this.restitution_.x >= 0) {
        this.position_.clampX(this.bounds_.minX, this.bounds_.maxX);

        // Handle bounce by inverting the velocity for each axis
        if (this.position_.x <= this.bounds_.minX ||
          this.position_.x >= this.bounds_.maxX) {
          this.lastVelocity_.x = (this.lastVelocity_.x * -1) * this.restitution_.x;
        }
      }
      else {
        if (this.boundOverflow_.x != 0) {
          this.activeOffsetFriction_.x = this.offsetFriction_.x;
          this.deflowBoundX_();
        }
        else {
          this.activeOffsetFriction_.x = 0;
        }

        var boundDiffMinX = 0;
        var boundDiffMaxX = 0;

        if ((boundDiffMinX = this.bounds_.minX - this.position_.x) > 0) {
          this.boundOverflow_.x = boundDiffMinX;
        }
        else if ((boundDiffMaxX = this.bounds_.maxX - this.position_.x) < 0) {
          this.boundOverflow_.x = boundDiffMaxX;
        }
        else {
          this.boundOverflow_.x = 0;
        }
      }
    }

    if (this.hasBoundsY_) {
      if (this.restitution_.y >= 0) {
        this.position_.clampY(this.bounds_.minY, this.bounds_.maxY);

        // Handle bounce by inverting the velocity for each axis
        if (this.position_.y <= this.bounds_.minY ||
          this.position_.y >= this.bounds_.maxY) {
          this.lastVelocity_.y = (this.lastVelocity_.y * -1) * this.restitution_.y;
        }
      }
      else {
        if (this.boundOverflow_.y != 0) {
          this.activeOffsetFriction_.y = this.offsetFriction_.y;
          this.deflowBoundY_();
        }
        else {
          this.activeOffsetFriction_.y = 0;
        }

        var boundDiffMinY = 0;
        var boundDiffMaxY = 0;

        if ((boundDiffMinY = this.bounds_.minY - this.position_.y) > 0) {
          this.boundOverflow_.y = boundDiffMinY;
        }
        else if ((boundDiffMaxY = this.bounds_.maxY - this.position_.y) < 0) {
          this.boundOverflow_.y = boundDiffMaxY;
        }
        else {
          this.boundOverflow_.y = 0;
        }
      }
    }
  }
};

/**
 * @private
 */
momentum.Handler.prototype.positionUpdated_ = function() {
  this.applyBounds_();

  if (this.position_.x != this.lastPosition_.x || this.position_.y != this.lastPosition_.y) {
    for (var i = 0, len = this.moveCallbacks_.length; i < len; i++) {
      this.moveCallbacks_[i](
        this.position_.x,
        this.position_.y,
        this.lastVelocity_.x,
        this.lastVelocity_.y
      );
    }

    this.lastPosition_.x = this.position_.x;
    this.lastPosition_.y = this.position_.y;
  }
};

/**
 * @param {number} num
 * @param {number} precision
 * @return {number}
 */
momentum.Handler.prototype.getPrecisionNumber_ = function(num, precision) {
  var number = num.toString();
  return parseFloat(number.substring(0, number.indexOf('.') + (1 + precision))) || 0;
};

/**
 * @private
 */
momentum.Handler.prototype.deflowBoundX_ = function() {
  if (this.boundOverflow_.x != 0) {
    var restitution = this.restitution_.x;

    if (this.dragging_) {
      restitution /= 2;
    }

    this.position_.x += this.getPrecisionNumber_(this.boundOverflow_.x * (1 + restitution), this.precision_);
  }
};

/**
 * @private
 */
momentum.Handler.prototype.deflowBoundY_ = function() {
  if (this.boundOverflow_.y != 0) {
    var restitution = this.restitution_.x;

    if (this.dragging_) {
      restitution /= 2;
    }

    this.position_.y += this.getPrecisionNumber_(this.boundOverflow_.y * (1 + restitution), this.precision_);
  }
}

/**
 * @private
 */
momentum.Handler.prototype.decelerate_ = function() {
  if (!this.allowDecelerating_) {
    return;
  }

  this.decelerating_ = true;

  if (Math.abs(this.lastVelocity_.x) > 0) {
    var friction = this.activeOffsetFriction_.x > 0 ? this.activeOffsetFriction_.x : this.friction_.x;
    this.lastVelocity_.x = this.getPrecisionNumber_(this.lastVelocity_.x * (1 - friction), this.precision_);
    this.position_.x += this.lastVelocity_.x;
    this.position_.x = parseFloat(this.position_.x.toFixed(this.precision_));
  }

  if (Math.abs(this.lastVelocity_.y) > 0) {
    var friction = this.activeOffsetFriction_.y > 0 ? this.activeOffsetFriction_.y : this.friction_.y;
    this.lastVelocity_.y = this.getPrecisionNumber_(this.lastVelocity_.y * (1 - friction), this.precision_);
    this.position_.y += this.lastVelocity_.y;
    this.position_.y = parseFloat(this.position_.y.toFixed(this.precision_));
  }

  // Clamp velocity in case it changed during deceleration
  this.lastVelocity_.clamp(-this.maxVelocity_, this.maxVelocity_);

  // Notify listeners and apply bounds
  this.positionUpdated_();

  if (Math.abs(this.lastVelocity_.x) > 0 || Math.abs(this.lastVelocity_.y) > 0 ||
    this.boundOverflow_.x != 0 || this.boundOverflow_.y != 0) {
    this.requestAnimationFrame_(this.decelerate_, this);
  }
  else {
    this.decelerating_ = false;
  }
};

/**
 * @param {Function} callback
 * @param {Object} ctx
 * @private
 */
momentum.Handler.prototype.requestAnimationFrame_ = function(callback, ctx) {
  if ( ! this.animationsStopped_) {
    (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame)(callback.bind(ctx));
  }
};
momentum = {};
momentum.utils = {};

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
  this.x = Math.min(Math.max(this.x, min), max);
  this.y = Math.min(Math.max(this.y, min), max);
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
   * @type {number}
   */
  this.friction_ = 0.035;

  /**
   * @private
   * @type {number}
   */
  this.restitution_ = 0;

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
};

/**
 * @public
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Handler.prototype.onMove = function(callback, optCtx) {
  this.moveCallbacks_.push(callback.bind(optCtx || this));
};

/**
 * @public
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Handler.prototype.onDown = function(callback, optCtx) {
  this.downCallback_ = callback.bind(optCtx || this);
};

/**
 * @public
 * @param {number} friction
 */
momentum.Handler.prototype.setFriction = function(friction) {
  this.friction_ = Math.min(Math.max(friction, 0), 1);
};

/**
 * @public
 * @param {number} threshold
 */
momentum.Handler.prototype.setThreshold = function(threshold) {
  this.threshold_ = threshold;
};

/**
 * @public
 * @param {number} restitution
 */
momentum.Handler.prototype.setRestitution = function(restitution) {
  this.restitution_ = Math.min(Math.max(restitution, 0), 1);
};

/**
 * @public
 * @param {number} maxVelocity
 */
momentum.Handler.prototype.setMaxVelocity = function(maxVelocity) {
  this.maxVelocity_ = Math.max(maxVelocity, 0);
};

/**
 * @public
 * @return {number}
 */
momentum.Handler.prototype.getFriction = function() {
  return this.friction_;
};

/**
 * @public
 * @return {number}
 */
momentum.Handler.prototype.getThreshold = function() {
  return this.threshold_;
};

/**
 * @public
 * @return {number}
 */
momentum.Handler.prototype.getRestitution = function() {
  return this.restitution_;
};

/**
 * @public
 * @return {number}
 */
momentum.Handler.prototype.getMaxVelocity = function() {
  return this.maxVelocity_;
};

/**
 * @public
 * @return {Element}
 */
momentum.Handler.prototype.getTarget = function() {
  return this.target_;
};

/**
 * @public
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
 * @public
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
  }
};

/**
 * @public
 */
momentum.Handler.prototype.init = function() {
  if ('ontouchstart' in window || navigator.msMaxTouchPoints) {
    this.target_.addEventListener('touchend', this.handleUserUp_.bind(this), false);
    this.target_.addEventListener('touchcancel', this.handleUserUp_.bind(this), false);
    this.target_.addEventListener('touchstart', this.handleUserDown_.bind(this), false);
    this.target_.addEventListener('touchmove', this.handleUserMove_.bind(this), false);
  } else {
    this.target_.addEventListener('mouseup', this.handleUserUp_.bind(this), false);
    this.target_.addEventListener('mouseleave', this.handleUserUp_.bind(this), false);
    this.target_.addEventListener('mousedown', this.handleUserDown_.bind(this), false);
    this.target_.addEventListener('mousemove', this.handleUserMove_.bind(this), false);
  }
};

/**
 * @public
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
 * @public
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
 * @param {Event} event
 * @return {momentum.Coordinate}
 */
momentum.Handler.prototype.getEventPosition_ = function(event) {
  var position = new momentum.Coordinate();

  if (event.hasOwnProperty('touches')) {
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
      Math.abs(this.lastVelocity_.y) >= this.threshold_) {
      this.decelerate_();
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
      this.position_.clampX(this.bounds_.minX, this.bounds_.maxX);

      // Handle bounce by inverting the velocity for each axis
      if (this.position_.x <= this.bounds_.minX ||
        this.position_.x >= this.bounds_.maxX &&
        this.restitution_ > 0) {
        this.lastVelocity_.x = (this.lastVelocity_.x * -1) * this.restitution_;
      }
    }

    if (this.hasBoundsY_) {
      this.position_.clampY(this.bounds_.minY, this.bounds_.maxY);

      // Handle bounce by inverting the velocity for each axis
      if (this.position_.y <= this.bounds_.minY ||
        this.position_.y >= this.bounds_.maxY &&
        this.restitution_ > 0) {
        this.lastVelocity_.y = (this.lastVelocity_.y * -1) * this.restitution_;
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
  number = num.toString();
  return parseFloat(number.substring(0, number.indexOf('.') + (1 + precision))) || 0;
};

/**
 * @private
 */
momentum.Handler.prototype.decelerate_ = function() {
  if (!this.allowDecelerating_) {
    return;
  }

  if (Math.abs(this.lastVelocity_.x) > 0) {
    this.lastVelocity_.x = this.getPrecisionNumber_(this.lastVelocity_.x * (1 - this.friction_), this.precision_);
    this.position_.x += this.lastVelocity_.x;
  }

  if (Math.abs(this.lastVelocity_.y) > 0) {
    this.lastVelocity_.y = this.getPrecisionNumber_(this.lastVelocity_.y * (1 - this.friction_), this.precision_);
    this.position_.y += this.lastVelocity_.y;
  }

  // Clamp velocity in case it changed during deceleration
  this.lastVelocity_.clamp(-this.maxVelocity_, this.maxVelocity_);

  // Notify listeners and apply bounds
  this.positionUpdated_();

  if (Math.abs(this.lastVelocity_.x) > 0 || Math.abs(this.lastVelocity_.y) > 0) {
    this.requestAnimationFrame_(this.decelerate_, this);
  }
};

/**
 * @param {Function} callback
 * @param {Object} ctx
 * @private
 */
momentum.Handler.prototype.requestAnimationFrame_ = function(callback, ctx) {
  (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame)(callback.bind(ctx));
};

/**
 * @param {string=} optProp
 * @return {string}
 */
momentum.utils.getVendor = function(optProp) {
  var property = '';
  var styles = window.getComputedStyle(document.documentElement, '');
  var prefix = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) ||
         (styles.OLink === '' && ['', 'o']))[1];

  if (prefix.length > 0 && optProp) {
    property = optProp[0].toUpperCase() + optProp.substr(1);
  }

  return prefix[0].toUpperCase() + prefix.substr(1) + property;
};

/**
 * @param {Element} element
 * @param {string} style
 * @param {boolean=} optVendorize
 * @return {string}
 */
momentum.utils.getStyle = function(element, style, optVendorize) {
  return window.getComputedStyle(element)[optVendorize ? momentum.utils.getVendor(style) : style];
};

/**
 * @param {Element} element
 * @param {string} style
 * @param {string} property
 * @param {boolean=} optVendorize
 */
momentum.utils.setStyle = function(element, property, value, optVendorize) {
  element.style[property] = value;

  if (optVendorize) {
    element.style[momentum.utils.getVendor(property)] = value;
  }
};

/**
 * @param {Element} element
 * @param {number} x
 * @param {number} y
 */
momentum.utils.setTranslation = function(element, x, y) {
  momentum.utils.setStyle(element, 'transform', 'translate3d(' + x + 'px,' + y + 'px,0)', true);
};

/**
 * @constructpr
 * @param {Element} element
 * @param {{
 *   container: (Element|undefined),
 *   containerBounds: (boolean|undefined),
 *   bounds: ({
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number
 *   }|undefined),
 *   anchorX: (number|undefined),
 *   anchorY: (number|undefined),
 *   threshold: (number|undefined),
 *   restitution: (number|undefined),
 *   maxVelocity: (number|undefined)
 * }=} optConfig
 */
momentum.Draggable = function(element, optConfig) {
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
   * @type {momentum.Coordinate}
   */
  this.anchorPoint_ = new momentum.Coordinate(.5, .5);

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.positionOffset_ = new momentum.Coordinate();

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.startPosition_ = new momentum.Coordinate();

  /**
   * @pubic
   * @type {Object}
   */
  this.config = optConfig || {};

  /**
   * @private
   * @type {momentum.Handler}
   */
  this.handler_ = null;

  /**
   * Initialize self
   */
  this.init_();
};

/**
 * @public
 * @param {boolean=} optPreventHandler
 */
momentum.Draggable.prototype.update = function(optPreventHandler) {
  optPreventHandler = optPreventHandler && optPreventHandler === true;

  // Update anchor points
  this.anchorPoint_.x = this.config.anchorX || this.anchorPoint_.x;
  this.anchorPoint_.y = this.config.anchorY || this.anchorPoint_.y;

  // Update element bounds and offsets
  this.elementBounds_ = this.element_.getBoundingClientRect();
  this.positionOffset_.x = this.elementBounds_.width * this.anchorPoint_.x;
  this.positionOffset_.y = this.elementBounds_.height * this.anchorPoint_.y;

  // Set start position
  this.startPosition_.x = this.element_.offsetLeft;
  this.startPosition_.y = this.element_.offsetTop;

  var containerOffset = new momentum.Coordinate();
  var parentElement = this.element_.parentElement;

  while (parentElement) {
    if (parentElement != this.handler_.getTarget()) {
      var position = momentum.utils.getStyle(parentElement, 'position');

      if (position == 'relative' || position == 'absolute') {
        var bounds = parentElement.getBoundingClientRect();

        if (bounds.left > containerOffset.x) {
          containerOffset.x = bounds.left;
        }

        if (bounds.top > containerOffset.y) {
          containerOffset.y = bounds.top;
        }
      }
    }
    else {
      break;
    }

    parentElement = parentElement.parentElement;
  }

  this.startPosition_.x += containerOffset.x;
  this.startPosition_.y += containerOffset.y;

  if (!isNaN(this.config.restitution)) {
    this.handler_.setRestitution(this.config.restitution);
  }

  if (!isNaN(this.config.friction)) {
    this.handler_.setFriction(this.config.friction);
  }

  if (!isNaN(this.config.threshold)) {
    this.handler_.setThreshold(this.config.threshold);
  }

  if (!isNaN(this.config.maxVelocity)) {
    this.handler_.setMaxVelocity(this.config.maxVelocity);
  }

  if (this.config.bounds) {
    this.handler_.setBounds(
      this.config.bounds.x + this.positionOffset_.x,
      this.config.bounds.x + this.config.bounds.width - this.positionOffset_.x,
      this.config.bounds.y + this.positionOffset_.y,
      this.config.bounds.y + this.config.bounds.height - this.positionOffset_.y
    )
  }
  else if (this.config.containerBounds) {
    var containerBounds = this.handler_.getTargetBounds(true);

    this.handler_.setBounds(
      this.positionOffset_.x, containerBounds.width - this.positionOffset_.x,
      this.positionOffset_.y, containerBounds.height - this.positionOffset_.y
    );
  }

  // Update handler
  if ( ! optPreventHandler) {
    this.handler_.update();
  }
};

/**
 * @private
 */
momentum.Draggable.prototype.init_ = function() {
  // Setup handler
  this.handler_ = new momentum.Handler(this.config.container);
  this.handler_.onDown(this.handleDown_, this);
  this.handler_.onMove(this.handleMove_, this);

  // Update dragger only to set the initial position first, which
  // will needs some values calculated in the update method.
  this.update(true);

  // Set the initial position
  var initialPosition = this.handler_.getRelativeElementPosition(this.element_);

  this.handler_.setPosition(
    initialPosition.x + this.positionOffset_.x,
    initialPosition.y + this.positionOffset_.y,
    true
  );

  // Update the handler after the startposition was set. This will ensure
  // that all bounds will be set properly.
  this.handler_.update();

  // Init handler
  this.handler_.init();
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 */
momentum.Draggable.prototype.translate_ = function(x, y) {
  x = x - this.positionOffset_.x - this.startPosition_.x;
  y = y - this.positionOffset_.y - this.startPosition_.y;

  momentum.utils.setTranslation(this.element_, x, y);
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
momentum.Draggable.prototype.hitTest_ = function(x, y) {
  var elementPosition = this.handler_.getRelativeElementPosition(this.element_);

  return x >= elementPosition.x && x < elementPosition.x + this.elementBounds_.width &&
         y >= elementPosition.y && y < elementPosition.y + this.elementBounds_.height;
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
momentum.Draggable.prototype.handleDown_ = function(x, y) {
  return this.hitTest_(x, y);
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 */
momentum.Draggable.prototype.handleMove_ = function(x, y) {
  this.translate_(x, y);
};
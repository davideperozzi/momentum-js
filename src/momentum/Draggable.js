goog.provide('momentum.Draggable');

// momentum
goog.require('momentum.Handler');
goog.require('momentum.Coordinate');
goog.require('momentum.utils');

/**
 * @constructor
 * @param {Element} element
 * @param {MomentumDraggableConfig} optConfig
 */
momentum.Draggable = function(element, optConfig) {
  /**
   * @private
   * @type {Element}
   */
  this.element_ = element;

  /**
   * @public
   * @type {MomentumDraggableConfig}
   */
  this.config = optConfig || {};

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
   * @private
   * @type {momentum.Handler}
   */
  this.handler_ = null;

  /**
   * @private
   * @type {boolean}
   */
  this.destroyed_ = false;

  /**
   * Initialize self
   */
  this.init_();
};

/**
 * @export
 * @type {MomentumDraggableConfig}
 */
momentum.Draggable.prototype.config = {};

/**
 * @export
 */
momentum.Draggable.prototype.updateSettings = function() {
  if (this.config.restitution && !isNaN(this.config.restitution)) {
    this.handler_.setRestitution(this.config.restitution);
  }

  if (this.config.friction && !isNaN(this.config.friction)) {
    this.handler_.setFriction(this.config.friction);
  }

  if (this.config.offsetFriction && !isNaN(this.config.offsetFriction)) {
    this.handler_.setOffsetFriction(this.config.offsetFriction);
  }

  if (this.config.threshold && !isNaN(this.config.threshold)) {
    this.handler_.setThreshold(this.config.threshold);
  }

  if (this.config.maxVelocity && !isNaN(this.config.maxVelocity)) {
    this.handler_.setMaxVelocity(this.config.maxVelocity);
  }
};

/**
 * @export
 * @param {boolean=} optNoCache
 */
momentum.Draggable.prototype.updateBounds = function(optNoCache) {
  if (this.config.elementBounds) {
    if (optNoCache || ! this.config.bounds) {
      this.config.bounds = this.config.elementBounds.getBoundingClientRect();
    }
  }

  if (this.config.bounds) {
    this.handler_.setBounds(
      this.config.bounds.x + this.positionOffset_.x,
      this.config.bounds.x + this.config.bounds.width - (this.elementBounds_.width - this.positionOffset_.x),
      this.config.bounds.y + this.positionOffset_.y,
      this.config.bounds.y + this.config.bounds.height - (this.elementBounds_.height - this.positionOffset_.y)
    );
  }
  else if (this.config.containerBounds) {
    var containerBounds = this.handler_.getTargetBounds(optNoCache);
    var overflowX = this.elementBounds_.width > containerBounds.width;
    var overflowY = this.elementBounds_.height > containerBounds.height;

    this.handler_.setBounds(
      overflowX ? this.positionOffset_.x + containerBounds.width - this.elementBounds_.width : this.positionOffset_.x,
      overflowX ? this.positionOffset_.x : containerBounds.width - (this.elementBounds_.width - this.positionOffset_.x),
      overflowY ? this.positionOffset_.y + containerBounds.height - this.elementBounds_.height : this.positionOffset_.y,
      overflowY ? this.positionOffset_.y : containerBounds.height - (this.elementBounds_.height - this.positionOffset_.y)
    );
  }
};

/**
 * @export
 * @param {boolean=} optPreventHandler
 */
momentum.Draggable.prototype.update = function(optPreventHandler) {
  optPreventHandler = optPreventHandler && optPreventHandler === true;

  // Update element bounds and offsets
  this.elementBounds_ = this.element_.getBoundingClientRect();

  // Update anchor points
  if (!this.config.autoAnchor) {
    this.anchorPoint_.x = this.config.anchorX || this.anchorPoint_.x;
    this.anchorPoint_.y = this.config.anchorY || this.anchorPoint_.y;
    this.positionOffset_.x = this.elementBounds_.width * this.anchorPoint_.x;
    this.positionOffset_.y = this.elementBounds_.height * this.anchorPoint_.y;
  }

  // Set start position
  this.startPosition_.x = this.element_.offsetLeft;
  this.startPosition_.y = this.element_.offsetTop;

  var containerOffset = new momentum.Coordinate();
  var parentElement = this.element_.parentElement;

  while (parentElement) {
    if (parentElement != this.handler_.getTarget()) {
      var position = momentum.utils.getStyle(parentElement, 'position');

      if (position == 'relative' || position == 'absolute') {
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

  // Update bounds with a refresh
  this.updateBounds(true);

  // Update handler
  if ( ! optPreventHandler) {
    this.handler_.update();
  }
};

/**
 * @export
 */
momentum.Draggable.prototype.reset = function() {
  this.destroy();
  this.restore();
};

/**
 * @export
 */
momentum.Draggable.prototype.destroy = function() {
  this.destroyed_ = true;

  this.handler_.destroy();
  delete this.handler_;
  this.handler_ = null;

  momentum.utils.removeStyle(this.element_, 'transform', true);
};

/**
 * @export
 */
momentum.Draggable.prototype.restore = function() {
  this.destroyed_ = false;

  this.init_();
};

/**
 * @private
 */
momentum.Draggable.prototype.init_ = function() {
  // Setup handler
  this.handler_ = new momentum.Handler(this.config.container);
  this.handler_.onUp(this.handleUp_, this);
  this.handler_.onDown(this.handleDown_, this);
  this.handler_.onMove(this.handleMove_, this);

  // Update settings
  this.updateSettings();

  // Set the initial position
  this.setInitialPostiion_();

  // Initial update
  this.update();

  // Init handler
  this.handler_.init();

  // Listen for browser events
  if (this.config.resizeUpdate) {
    window.addEventListener('resize', function(){
      setTimeout(function(){
        this.setInitialPostiion_();
        this.update();
      }.bind(this), 0);
    }.bind(this), false);
  }
};

/**
 * @private
 */
momentum.Draggable.prototype.setInitialPostiion_ = function()
{
  var initialPosition = this.handler_.getRelativeElementPosition(this.element_);

  this.handler_.setPosition(
    initialPosition.x + this.positionOffset_.x,
    initialPosition.y + this.positionOffset_.y,
    true
  );
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 */
momentum.Draggable.prototype.translate_ = function(x, y) {
  if (this.destroyed_) {
    return;
  }

  x = x - this.positionOffset_.x - this.startPosition_.x;
  y = y - this.positionOffset_.y - this.startPosition_.y;

  if (this.config.lockAxis) {
    if (goog.isObject(this.config.lockAxis)) {
      if (true == this.config.lockAxis.y) {
        y = 0;
      }

      if (true == this.config.lockAxis.x) {
        x = 0;
      }
    }
  }

  momentum.utils.setTranslation(this.element_, x, y);

  if (this.config.onTranslate) {
    this.config.onTranslate(
      x,
      y,
      this.elementBounds_.width,
      this.elementBounds_.height,
      this.config.bounds
        ? this.config.bounds
        : this.handler_.getTargetBounds()
    );
  }
};

/**
 * @private
 * @param {number} x1
 * @param {number} x2
 * @param {number} y1
 * @param {number} y2
 * @param {number} width
 * @param {number} height
 * @return {boolean}
 */
momentum.Draggable.prototype.hitTest_ = function(x1, y1, x2, y2, width, height) {
  return x1 >= x2 && x1 < x2 + width && y1 >= y2 && y1 < y2 + height;
};

/**
 * @private
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
momentum.Draggable.prototype.handleDown_ = function(x, y) {
  if (this.destroyed_) {
    return false;
  }

  var elementPosition = this.handler_.getRelativeElementPosition(this.element_);
  var containsPoint = this.hitTest_(x, y, elementPosition.x, elementPosition.y,
    this.elementBounds_.width, this.elementBounds_.height);

  if (this.config.autoAnchor && containsPoint) {
    this.positionOffset_.x = x - elementPosition.x;
    this.positionOffset_.y = y - elementPosition.y;
    this.updateBounds();
  }

  if (this.config.onDown) {
    var customHit = this.config.onDown(containsPoint, x, y, elementPosition.x, elementPosition.y,
      this.elementBounds_.width, this.elementBounds_.height);

    if (goog.isBoolean(customHit)) {
      return customHit;
    }
  }

  return containsPoint;
};

/**
 * @private
 */
momentum.Draggable.prototype.handleUp_ = function()
{
  if (this.destroyed_) {
    return;
  }

  if (this.config.onUp) {
    this.config.onUp();
  }
};

/**
 * @private
 * @param {number} posX
 * @param {number} posY
 * @param {number} velX
 * @param {number} velY
 */
momentum.Draggable.prototype.handleMove_ = function(posX, posY, velX, velY) {
  if (this.destroyed_) {
    return;
  }

  if (this.config.onMove) {
    var newPosition = this.config.onMove(posX, posY, velX,  velY);

    if (goog.isObject(newPosition)) {
      if (newPosition.hasOwnProperty('x')) {
        posX = parseFloat(newPosition['x']);
      }

      if (newPosition.hasOwnProperty('y')) {
        posY = parseFloat(newPosition['y']);
      }
    }
  }

  this.translate_(posX, posY);
};
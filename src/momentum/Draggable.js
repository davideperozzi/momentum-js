goog.provide('momentum.Draggable');

// momentum
goog.require('momentum.Handler');
goog.require('momentum.HandlerComponent');
goog.require('momentum.Coordinate');
goog.require('momentum.utils');

/**
 * @constructor
 * @param {Element} element
 * @param {MomentumDraggableConfig} optConfig
 * @extends {momentum.HandlerComponent}
 */
momentum.Draggable = function(element, optConfig) {
  momentum.Draggable.base(this, 'constructor');

  /**
   * @private
   * @type {Element}
   */
  this.element_ = element;

  /**
   * @public
   * @type {MomentumDraggableConfig}
   */
  this.defaults_ = {
    // @depcrecated: containerBounds is deprecated and will be removed in the future.
    //               Use elementBounds instead
    //
    // containerBounds: true,
    container: document.documentElement,
    elementBounds: 'container',
    restitution: -0.6,
    resizeUpdate: true,
    autoAnchor: true
  };

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
  this.lastTranslation_ = new momentum.Coordinate();

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.positionOffset_ = new momentum.Coordinate();

  /**
   * @private
   * @type {momentum.Coordinate}
   */
  this.scrollOffset_ = new momentum.Coordinate();

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
   * @private
   * @type {boolean}
   */
  this.hasTranslation_ = false;

  /**
   * @private
   * @type {Array<Element>}
   */
  this.scrollContainers_ = [];

  /**
   * Initialize self
   */
  this.init_();
};

goog.inherits(
  momentum.Draggable,
  momentum.HandlerComponent
);

/**
 * @export
 * @type {MomentumDraggableConfig}
 */
momentum.Draggable.prototype.config = {};

/**
 * @export
 */
momentum.Draggable.prototype.updateSettings = function() {
  // Merge config
  var config = this.defaults_;

  momentum.utils.extendObject(config, this.config);

  this.config = config;

  // Notify handler about the new settings
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
      if (goog.isString(this.config.elementBounds)) {
        switch (this.config.elementBounds) {
          case 'parent':
            var parentNode = /** @type {Element} */ (this.element_.parentNode);

            if (parentNode != this.element_) {
              this.config.elementBounds = parentNode;
            }
            else {
              this.config.elementBounds = this.config.container;
            }
            break;
          case 'container':
            this.config.elementBounds = this.config.container || document.documentElement;
            break;
        }

        if (this.config.elementBounds.nodeType === Node.DOCUMENT_NODE) {
          this.config.elementBounds = document.documentElement;
        }
      }

      if (this.config.elementBounds.nodeType === Node.ELEMENT_NODE) {
        // Use the bounds of the element and change the position of the object.
        // This ensures the scroll position is included in the calculations
        var bounds = this.config.elementBounds.getBoundingClientRect();
        var offset = momentum.utils.getPageOffset(this.config.elementBounds);

        bounds.left = bounds.x = offset.x;
        bounds.top = bounds.y = offset.y;

        this.config.bounds = bounds;
      }
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
};

/**
 * @export
 */
momentum.Draggable.prototype.updateScrollPositions = function()
{
  this.scrollOffset_.x = 0;
  this.scrollOffset_.y = 0;

  for (var i = 0, len = this.scrollContainers_.length; i < len; i++) {
    var container = this.scrollContainers_[i];
    var bounds = container.getBoundingClientRect();

    if (container.scrollHeight > bounds.height) {
      this.scrollOffset_.y += container.scrollTop;
    }

    if (container.scrollWidth > bounds.width) {
      this.scrollOffset_.x += container.scrollLeft;
    }
  }
};

/**
 * {@inheritDoc}
 */
momentum.Draggable.prototype.getHandler = function()
{
  return this.handler_;
};

/**
 * @export
 * @param {boolean=} optPreventHandler
 */
momentum.Draggable.prototype.update = function(optPreventHandler) {
  optPreventHandler = optPreventHandler && optPreventHandler === true;

  if ( ! optPreventHandler) {
    this.updateSettings();
  }

  // Update element bounds and offsets
  this.elementBounds_ = this.element_.getBoundingClientRect();

  // Update anchor points
  if ( ! this.config.autoAnchor) {
    this.anchorPoint_.x = goog.isDef(this.config.anchorX) ? this.config.anchorX : this.anchorPoint_.x;
    this.anchorPoint_.y = goog.isDef(this.config.anchorY) ? this.config.anchorY : this.anchorPoint_.y;
    this.positionOffset_.x = this.elementBounds_.width * this.anchorPoint_.x;
    this.positionOffset_.y = this.elementBounds_.height * this.anchorPoint_.y;
  }

  // Set start position
  this.startPosition_.x = this.element_.offsetLeft;
  this.startPosition_.y = this.element_.offsetTop;

  var scrollContainers = [];
  var containerOffset = new momentum.Coordinate();
  var parentElement = this.element_.parentElement;

  while (parentElement) {
    if (parentElement == this.handler_.getTarget()) {
      break;
    }

    var position = momentum.utils.getStyle(parentElement, 'position');
    var overflow = momentum.utils.getStyle(parentElement, 'overflow');

    if (position == 'relative' || position == 'absolute') {
      var offset = momentum.utils.getPageOffset(parentElement);

      if (offset.x > containerOffset.x) {
        containerOffset.x = offset.x;
      }

      if (offset.y > containerOffset.y) {
        containerOffset.y = offset.y;
      }
    }

    if (overflow == 'auto' || overflow == 'scroll') {
      scrollContainers.push(parentElement);
    }

    parentElement = parentElement.parentElement;
  }

  this.startPosition_.x += containerOffset.x;
  this.startPosition_.y += containerOffset.y;

  // Remove old scroll containers
  for (var i = 0, len = this.scrollContainers_.length; i < len; i++) {
    if (scrollContainers.indexOf(this.scrollContainers_[i]) === -1) {
      this.scrollContainers_[i].removeEventListener('scroll');
      this.scrollContainers_.splice(i, 1);
    }
  }

  // Add new scroll containers
  for (var i = 0, len = scrollContainers.length; i < len; i++) {
    if (this.scrollContainers_.indexOf(scrollContainers[i]) === -1) {
      this.scrollContainers_.push(scrollContainers[i]);

      scrollContainers[i].addEventListener('scroll', function(){
        setTimeout(this.updateScrollPositions.bind(this), 0);
      }.bind(this), false);
    }
  }

  // Update scroll positions
  this.updateScrollPositions();

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
  this.handlerChanged();
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
  this.setInitialPosition_();

  // Initial update
  this.update();

  // Init handler
  this.handler_.init();

  // Disable translation
  this.hasTranslation_ = false;

  // Reset last translation
  this.lastTranslation_.x = 0;
  this.lastTranslation_.y = 0;

  // Listen for browser events
  if (this.config.resizeUpdate) {
    window.addEventListener('resize', function(){
      setTimeout(function(){
        this.setInitialPosition_();
        this.update();
      }.bind(this), 0);
    }.bind(this), false);
  }

  // Scroll elements
  window.addEventListener('scroll', function(){
    setTimeout(function(){
      this.updateScrollPositions();
      this.updateBounds(true);
    }.bind(this), 0);
  }.bind(this), false);
};

/**
 * @private
 * @return {Array<Element>}
 */
momentum.Draggable.prototype.getScrollContainers_ = function()
{
  var containers = [];

  momentum.utils.getAncestor(this.element_, function(parent){
    var overflow = momentum.utils.getStyle(parentElement, 'overflow');

    if (overflow == 'auto' || overflow == 'scroll') {
      containers.push(scrollContainers);
    }

    return parent == this.handler_.getTarget();
  }.bind(this));

  return containers;
};

/**
 * @private
 */
momentum.Draggable.prototype.setInitialPosition_ = function() {
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

  x = x - this.positionOffset_.x - this.startPosition_.x + this.scrollOffset_.x;
  y = y - this.positionOffset_.y - this.startPosition_.y + this.scrollOffset_.y;

  if (this.config.lockAxis && this.hasTranslation_) {
    if (goog.isObject(this.config.lockAxis)) {
      if (true == this.config.lockAxis.x) {
        x = this.lastTranslation_.x;
      }

      if (true == this.config.lockAxis.y) {
        y = this.lastTranslation_.y;
      }
    }
  }

  momentum.utils.setTranslation(this.element_, x, y);

  this.lastTranslation_.x = x;
  this.lastTranslation_.y = y;
  this.hasTranslation_ = true;

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
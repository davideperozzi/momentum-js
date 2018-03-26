goog.provide('momentumdebug.Configurator');

// momentum
goog.require('momentum.Draggable');
goog.require('momentum.utils');

// momentumdebug
goog.require('momentumdebug.ScriptLoader');

/**
 * @private
 * @constructor
 * @param {momentum.Handler} handler
 */
momentumdebug.HandlerInterface_ = function(handler)
{
  /**
   * @public
   * @type {number}
   */
  this['friction'] = handler.getFriction().x;

  /**
   * @public
   * @type {number}
   */
  this['restitution'] = handler.getRestitution().x;

  /**
   * @public
   * @type {number}
   */
  this['offsetFriction'] = handler.getOffsetFriction().x;

  /**
   * @public
   * @type {number}
   */
  this['maxVelocity'] = handler.getMaxVelocity();

  /**
   * @public
   * @type {number}
   */
  this['threshold'] = handler.getThreshold();

  /**
   * @public
   * @type {number}
   */
  this['velocityX'] = 0;

  /**
   * @public
   * @type {number}
   */
  this['velocityY'] = 0;
};

/**
 * @private
 * @constructor
 * @param {momentum.Draggable} draggable
 */
momentumdebug.DraggableInterface_ = function(draggable)
{
  /**
   * @public
   * @type {boolean}
   */
  this['autoAnchor'] = !!draggable.config.autoAnchor;

  /**
   * @public
   * @type {number}
   */
  this['anchorX'] = draggable.config.anchorX || 0.5;

  /**
   * @public
   * @type {number}
   */
  this['anchorY'] = draggable.config.anchorY || 0.5;

  /**
   * @public
   * @type {boolean}
   */
  this['lockAxisX'] = draggable.config.lockAxis ? !!draggable.config.lockAxis.x : false;

  /**
   * @public
   * @type {boolean}
   */
  this['lockAxisY'] = draggable.config.lockAxis ? !!draggable.config.lockAxis.y : false;

  /**
   * @public
   * @type {Function}
   */
  this['reset'] = function(){};
};

/**
 * @static
 * @type {momentumdebug.ScriptLoader}
 */
momentumdebug.datGuiLoader = momentumdebug.ScriptLoader.create(
  'datgui', 'https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.0/dat.gui.min.js'
);

/**
 * @constructor
 * @param {momentum.HandlerComponent} component
 * @param {Element=} optParentElement
 */
momentumdebug.Configurator = function(component, optParentElement)
{
  if ( ! (component instanceof momentum.HandlerComponent)) {
    throw new Error('Invalid handler component given');
  }

  /**
   * @private
   * @type {momentum.HandlerComponent}
   */
  this.component_ = component;

  /**
   * @private
   * @type {Element}
   */
  this.parent_ = optParentElement || null;

  /**
   * @private
   * @type {dat.GUI}
   */
  this.datGui_ = null;

  /**
   * @private
   * @type {Array<Object>}
   */
  this.folders_ = [];

  // dat.GUI checks and loading
  this.load_();
};

/**
 * @private
 */
momentumdebug.Configurator.prototype.load_ = function()
{
  if (momentumdebug.datGuiLoader.loaded) {
    this.init_();
  }
  else if (
    ! window.hasOwnProperty('dat') || (
      window.hasOwnProperty('dat') && ! goog.isDefAndNotNull(dat.GUI))
  ) {
    momentumdebug.datGuiLoader.load().onComplete(this.init_, this);
  }
  else {
    this.init_();
  }
};

/**
 * @private
 */
momentumdebug.Configurator.prototype.init_ = function()
{
  // Init dat.GUI
  this.datGui_ = new dat.GUI({ autoPlace: !!!this.parent_ });

  // Place element
  if (this.parent_) {
    this.parent_.appendChild(this.datGui_.domElement);
  }

  // Detect handler change
  this.component_.onHandlerChange(this.handleHandlerChange_.bind(this));

  // Initial field rendering
  this.renderFields_();
};

/**
 * @private
 */
momentumdebug.Configurator.prototype.handleHandlerChange_ = function()
{
  // Remove all registered folders
  for (var i = 0, len = this.folders_.length; i < len; i++) {
    this.datGui_.removeFolder(/** @type {dat.GUI.Folder} */ (this.folders_[i]));
  }

  this.folders_ = [];

  // Re-render all fields
  this.renderFields_();
};

/**
 * @private
 */
momentumdebug.Configurator.prototype.renderFields_ = function()
{
  // Set handler fields
  this.setHandlerFields_(this.component_.getHandler());

  // Set dragable fields
  if (this.component_ instanceof momentum.Draggable) {
    this.setDraggableFields_(this.component_);
  }
};

/**
 * @private
 * @param {momentum.Handler} handler
 */
momentumdebug.Configurator.prototype.setHandlerFields_ = function(handler)
{
  var controlInterface = new momentumdebug.HandlerInterface_(handler);
  var folder = this.datGui_.addFolder('Dynamics');

  // Friction
  folder.add(controlInterface, 'friction', 0, 1).onFinishChange(function(value){
    handler.setFriction(value);
  }.bind(this));

  // Restitution + Offset friction
  var offsetFrictionElement = null;

  folder.add(controlInterface, 'restitution', -1, 1).onFinishChange(function(value){
    handler.setRestitution(value);

    if (value < 0 && offsetFrictionElement.style.display == 'none') {
      offsetFrictionElement.style.display = 'block';
    }
    else if (value >= 0 && offsetFrictionElement.style.display == 'block') {
      offsetFrictionElement.style.display = 'none';
    }
  }.bind(this));

  var offsetFrictionItem = folder.add(controlInterface, 'offsetFriction', 0, 1).onFinishChange(function(value){
    handler.setOffsetFriction(value);
  }.bind(this)).name('offset friction');

  offsetFrictionElement = momentum.utils.getAncestorByTagName(offsetFrictionItem.domElement, 'li');

  if (controlInterface.restitution >= 0) {
    offsetFrictionElement.style.display = 'none';
  }

  // Max velocity
  var maxVelocityItem = folder.add(controlInterface, 'maxVelocity', 0, 100);

  // Threshold
  folder.add(controlInterface, 'threshold', 0).onFinishChange(function(value){
    handler.setThreshold(value);
  });

  // Velocity info
  var maxVelocity = controlInterface.maxVelocity;
  var velItemX = folder.add(controlInterface, 'velocityX', -maxVelocity, maxVelocity).step(.05).name('X-Velocity').listen();
  var velItemY = folder.add(controlInterface, 'velocityY', -maxVelocity, maxVelocity).step(.05).name('Y-Velocity').listen();

  maxVelocityItem.onFinishChange(function(value){
    velItemX.min(-value).max(value);
    velItemY.min(-value).max(value);

    handler.setMaxVelocity(value);
  });

  handler.onMove(function(posX, posY, velX, velY){
    controlInterface.velocityX = velX;
    controlInterface.velocityY = velY;
  });

  // Open folder on default
  folder.open();

  // Add folder to registry
  this.folders_.push(folder);
};

/**
 * @private
 * @param {momentum.Draggable} draggable
 */
momentumdebug.Configurator.prototype.setDraggableFields_ = function(draggable)
{
  var controlInterface = new momentumdebug.DraggableInterface_(draggable);
  var folder = this.datGui_.addFolder('Draggable');

  // Auto anchor + anchor
  var anchorElementX = null;
  var anchorElementY = null;

  folder.add(controlInterface, 'autoAnchor').onFinishChange(function(value){
    draggable.config.autoAnchor = value;

    if (anchorElementX && anchorElementY){
      anchorElementX.style.display = value ? 'none' : '';
      anchorElementY.style.display = value ? 'none' : '';
    }

    if ( ! value && ! goog.isDef(draggable.config.anchorX)) {
      draggable.config.anchorX = controlInterface.anchorX;
    }

    if ( ! value && ! goog.isDef(draggable.config.anchorY)) {
      draggable.config.anchorY = controlInterface.anchorY;
    }

    draggable.update(true);
  });

  var anchorItemX = folder.add(controlInterface, 'anchorX', 0, 1).onFinishChange(function(value){
    draggable.config.anchorX = value;
    draggable.update(true);
  });

  var anchorItemY = folder.add(controlInterface, 'anchorY', 0, 1).onFinishChange(function(value){
    draggable.config.anchorY = value;
    draggable.update(true);
  })

  anchorElementX = momentum.utils.getAncestorByTagName(anchorItemX.domElement, 'li');
  anchorElementY = momentum.utils.getAncestorByTagName(anchorItemY.domElement, 'li');

  if (!!draggable.config.autoAnchor) {
    anchorElementX.style.display = 'none';
    anchorElementY.style.display = 'none';
  }

  // Lock axis
  folder.add(controlInterface, 'lockAxisX').onFinishChange(function(value){
    draggable.config.lockAxis = {
      x: value,
      y: controlInterface['lockAxisY']
    };

    draggable.update(true);
  });

  folder.add(controlInterface, 'lockAxisY').onFinishChange(function(value){
    draggable.config.lockAxis = {
      x: controlInterface['lockAxisX'],
      y: value,
    };

    draggable.update(true);
  });

  // Reset
  folder.add(controlInterface, 'reset').name('Reset draggable').onFinishChange(function(){
    draggable.reset();
  });

  // Add folder to registry
  this.folders_.push(folder);
};
/**
 * @type {Object}
 */
momentum = {};

/**
 * @struct
 * @constructor
 * @param {number=} optX
 * @param {number=} optY
 */
momentum.Coordinate = function(optX, optY){
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
 * @return {momentum.Coordinate}
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
momentum.Element = function(optTarget) {
	/**
	 * @private
	 * @type {Element}
	 */
	this.target_ = optTarget || document.documentElement;

	/**
	 * @private
	 * @type {BoundingRect}
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
	 * @type {!Function}
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
 */
momentum.Element.prototype.init = function() {
	if ('ontouchstart' in window || navigator.msMaxTouchPoints) {
		this.target_.addEventListener('touchend', this.handleUserUp_.bind(this), false);
		this.target_.addEventListener('touchcancel', this.handleUserUp_.bind(this), false);
		this.target_.addEventListener('touchstart', this.handleUserDown_.bind(this), false);
		this.target_.addEventListener('touchmove', this.handleUserMove_.bind(this), false);
	}
	else {
		this.target_.addEventListener('mouseup', this.handleUserUp_.bind(this), false);
		this.target_.addEventListener('mouseleave', this.handleUserUp_.bind(this), false);
		this.target_.addEventListener('mousedown', this.handleUserDown_.bind(this), false);
		this.target_.addEventListener('mousemove', this.handleUserMove_.bind(this), false);
	}
};

/**
 * @public
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Element.prototype.onMove = function(callback, optCtx) {
	this.moveCallbacks_.push(callback.bind(optCtx || this));
};

/**
 * @public
 * @param {!Function} callback
 * @param {Object=} optCtx
 */
momentum.Element.prototype.onDown = function(callback, optCtx) {
	this.downCallback_ = callback.bind(optCtx || this);
};

/**
 * @public
 * @param {number} friction
 */
momentum.Element.prototype.setFriction = function(friction) {
	this.friction_ = Math.min(Math.max(friction, 0), 1);
};

/**
 * @public
 * @param {number} threshold
 */
momentum.Element.prototype.setThreshold = function(threshold) {
	this.threshold_ = threshold;
};

/**
 * @public
 * @param {number} restitution
 */
momentum.Element.prototype.setRestitution = function(restitution) {
	this.restitution_ = Math.min(Math.max(restitution, 0), 1);
};

/**
 * @public
 * @param {number} maxVelocity
 */
momentum.Element.prototype.setMaxVelocity = function(maxVelocity) {
	this.maxVelocity_ = Math.max(maxVelocity, 0);
};

/**
 * @public
 * @return {number}
 */
momentum.Element.prototype.getFriction = function() {
	return this.friction_;
};

/**
 * @public
 * @return {number}
 */
momentum.Element.prototype.getThreshold = function() {
	return this.threshold_;
};

/**
 * @public
 * @return {number}
 */
momentum.Element.prototype.getRestitution = function() {
	return this.restitution_;
};

/**
 * @public
 * @return {number}
 */
momentum.Element.prototype.getMaxVelocity = function() {
	return this.maxVelocity_;
};

/**
 * @public
 * @param {number} x
 * @param {number} y
 */
momentum.Element.prototype.setPosition = function(x, y) {
	this.position_.x = x;
	this.position_.y = y;
};

/**
 * @public
 * @param {number=} optMinX
 * @param {number=} optMaxX
 * @param {number=} optMinY
 * @param {number=} optMaxY
 */
momentum.Element.prototype.setBounds = function(optMinX, optMaxX, optMinY, optMaxY) {
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
momentum.Element.prototype.update = function() {
	this.positionUpdated_();
};

/**
 * @public
 * @param {Element} element
 * @return {momentum.Coordinate}
 */
momentum.Element.prototype.getRelativeElementPosition = function(element) {
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
momentum.Element.prototype.getEventPosition_ = function(event) {
	var position = new momentum.Coordinate();
	
	if (event.hasOwnProperty('touches')) {
		position.x = event.touches[0].clientX - this.targetBounds_.left;
		position.y = event.touches[0].clientY - this.targetBounds_.top;
	}
	else {
		position.x = event.clientX - this.targetBounds_.left;
		position.y = event.clientY - this.targetBounds_.top;
	}
	
	return position;
};

/**
 * @private
 * @param {MouseEvent} event
 */
momentum.Element.prototype.handleUserDown_ = function(event) {
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

momentum.Element.prototype.collectTrackingPoints_ = function() {
	this.addTrackingPoint_();
	this.updateTrackingPoints_();
	
	if (this.dragging_) {
		this.requestAnimationFrame_(this.collectTrackingPoints_, this);
	}
};

/**
 * @private
 */
momentum.Element.prototype.addTrackingPoint_ = function() {
	this.trackingPoints_.push(
		new momentum.TrackingPoint(this.position_.clone())
	);
};

/**
 * @private
 * @param {MouseEvent} event
 */
momentum.Element.prototype.handleUserMove_ = function(event) {
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
momentum.Element.prototype.updateTrackingPoints_ = function() {
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
 * @param {MouseEvent} event
 */
momentum.Element.prototype.handleUserUp_ = function(event) {
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
momentum.Element.prototype.clearStartProperties_ = function() {
	this.startPosition_.x = 0;
	this.startPosition_.y = 0;
	this.startTime_ = 0;
};

/**
 * @private
 */
momentum.Element.prototype.applyBounds_ = function() {
	if (this.hasBounds_) {
		if (this.hasBoundsX_) {
			this.position_.clampX(this.bounds_.minX, this.bounds_.maxX);
			
			// Handle bounce by inverting the velocity for each axis
			if (this.position_.x <= this.bounds_.minX || 
				this.position_.x >= this.bounds_.maxX) {
				this.lastVelocity_.x = (this.lastVelocity_.x <= 0 ? Math.abs(this.lastVelocity_.x) : -this.lastVelocity_.x) * this.restitution_;
			}
		}
		
		if (this.hasBoundsY_) {
			this.position_.clampY(this.bounds_.minY, this.bounds_.maxY);
			
			// Handle bounce by inverting the velocity for each axis
			if (this.position_.y <= this.bounds_.minY || 
				this.position_.y >= this.bounds_.maxY) {
				this.lastVelocity_.y = (this.lastVelocity_.y <= 0 ? Math.abs(this.lastVelocity_.y) : -this.lastVelocity_.y) * this.restitution_;
			}
		}
	}
};

/**
 * @private
 */
momentum.Element.prototype.positionUpdated_ = function() {
	this.applyBounds_();

	for (var i = 0, len = this.moveCallbacks_.length; i < len; i++) {
		this.moveCallbacks_[i](
			this.position_.x, 
			this.position_.y,
			this.lastVelocity_.x, 
			this.lastVelocity_.y
		);
	}
};

/**
 * @param {number} num
 * @param {number} precision
 * @return {number}
 */
momentum.Element.prototype.getPrecisionNumber_ = function(num, precision) {
	num = num.toString();
	return parseFloat(num.substring(0, num.indexOf('.') + (1+precision))) || 0;
};

/**
 * @private
 */
momentum.Element.prototype.decelerate_ = function() {
	if ( ! this.allowDecelerating_) {
		return;
	}

	if (Math.abs(this.lastVelocity_.x) > 0) {					
		this.lastVelocity_.x = this.getPrecisionNumber_(this.lastVelocity_.x * (1-this.friction_), this.precision_);
		this.position_.x += this.lastVelocity_.x;
	}
	
	if (Math.abs(this.lastVelocity_.y) > 0) {					
		this.lastVelocity_.y = this.getPrecisionNumber_(this.lastVelocity_.y * (1-this.friction_), this.precision_);		
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
 * @private
 */
momentum.Element.prototype.requestAnimationFrame_ = function(callback, ctx) {
	(window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame)(callback.bind(ctx));
};
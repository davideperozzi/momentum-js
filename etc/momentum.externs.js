/**
 * @externs
 */

/**
 * @typedef {{
 *   container: (Element|undefined),
 *   containerBounds: (boolean|undefined),
 *   elementBounds: (Element|string|undefined),
 *   bounds: (ClientRect|{
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number
 *   }|undefined),
 *   preventMove: (Function|undefined),
 *   autoAnchor: (boolean|undefined),
 *   anchorX: (number|undefined),
 *   anchorY: (number|undefined),
 *   threshold: (number|undefined),
 *   restitution: (number|undefined),
 *   friction: (number|undefined),
 *   offsetFriction: (number|undefined),
 *   maxVelocity: (number|undefined),
 *   resizeUpdate: (boolean|undefined),
 *   lockAxis: ({
 *     x: (boolean|undefined),
 *     y: (boolean|undefined)
 *   }|undefined),
 *   onDown: (Function|undefined),
 *   onMove: (Function|undefined),
 *   onUp: (Function|undefined),
 *   onTranslate: (Function|undefined)
 * }}
 */
var MomentumDraggableConfig;

/**
 * dat.GUI
 */

/**
 * @type {Object}
 */
var dat = {};

/**
 * @constructor
 * @param {{autoPlace: boolean}} config
 */
dat.GUI = function(config){};

/**
 * @public
 * @type {Element}
 */
dat.GUI.prototype.domElement;

/**
 * @public
 * @param {Object} obj
 * @param {string} name
 * @param {number=} min
 * @param {number=} max
 * @return {dat.GUI.Controller}
 */
dat.GUI.prototype.add = function(obj, name, min, max){};

/**
 * @public
 */
dat.GUI.prototype.close = function(){};

/**
 * @public
 */
dat.GUI.prototype.open = function(){};

/**
 * @public
 * @param {string} name
 * @return {dat.GUI.Folder}
 */
dat.GUI.prototype.addFolder = function(name){};

/**
 * @public
 * @param {dat.GUI.Folder} folder
 * @return {dat.GUI}
 */
dat.GUI.prototype.removeFolder = function(folder){};

/**
 * @constructor
 * @extends {dat.GUI}
 */
dat.GUI.Controller = function(){};

/**
 * @param {Function} callback
 * @return {dat.GUI}
 */
dat.GUI.Controller.prototype.onFinishChange = function(callback){};

/**
 * @public
 * @param {string} label
 * @return {dat.GUI.Controller}
 */
dat.GUI.Controller.prototype.name = function(label){};

/**
 * @public
 * @param {number} value
 * @return {dat.GUI.Controller}
 */
dat.GUI.Controller.prototype.step = function(value){};

/**
 * @public
 * @param {number} value
 * @return {dat.GUI.Controller}
 */
dat.GUI.Controller.prototype.min = function(value){};

/**
 * @public
 * @param {number} value
 * @return {dat.GUI.Controller}
 */
dat.GUI.Controller.prototype.max = function(value){};

/**
 * @public
 * @return {dat.GUI.Controller}
 */
dat.GUI.Controller.prototype.listen = function(){};

/**
 * @constructor
 * @extends {dat.GUI.Controller}
 */
dat.GUI.Folder = function(){};

/**
 * @public
 * @return {dat.GUI.Folder}
 */
dat.GUI.Folder.prototype.open = function(){};


/**
 * @type {{ exports: Object }}
 */
var module = {
  exports: {}
};
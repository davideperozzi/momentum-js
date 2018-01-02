/**
 * @externs
 */

/**
 * @typedef {{
 *   container: (Element|undefined),
 *   containerBounds: (boolean|undefined),
 *   elementBounds: (Element|undefined),
 *   bounds: (ClientRect|{
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number
 *   }|undefined),
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
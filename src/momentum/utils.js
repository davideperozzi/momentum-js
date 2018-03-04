goog.provide('momentum.utils');

// momentum
goog.require('momentum.Coordinate');

/**
 * @private
 * @type {string}
 */
momentum.utils.cachedVendor_ = '';

/**
 * @private
 * @type {Object}
 */
momentum.utils.cachedVendorProps_ = {};

/**
 * @param {string=} optProp
 * @return {string}
 */
momentum.utils.getVendor = function(optProp) {
  var property = '';
  var prefix = '';

  if (optProp && momentum.utils.cachedVendorProps_.hasOwnProperty(optProp)) {
    return momentum.utils.cachedVendorProps_[optProp];
  }

  if (momentum.utils.cachedVendor_ != '') {
    prefix = momentum.utils.cachedVendor_;
  }
  else {
    var styles = window.getComputedStyle(document.documentElement, '');
    prefix = momentum.utils.cachedVendor_ = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) ||
         (styles.OLink && styles.OLink === '' && ['', 'o']))[1];
  }

  var vendorPrefix = prefix[0].toUpperCase() + prefix.substr(1);

  if (prefix.length > 0 && optProp) {
    property = optProp[0].toUpperCase() + optProp.substr(1);
    momentum.utils.cachedVendorProps_[optProp] = vendorPrefix + property;
  }

  return vendorPrefix + property;
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
 * @param {string} property
 * @param {string} value
 * @param {boolean=} optVendorize
 */
momentum.utils.setStyle = function(element, property, value, optVendorize) {
  element.style[property] = value;

  if (optVendorize) {
    element.style[momentum.utils.getVendor(property)] = value;
  }
};

/**
 * @public
 * @param {Element} element
 * @param {string} property
 * @param {boolean=} optVendorize
 */
momentum.utils.removeStyle = function(element, property, optVendorize)
{
  element.style[property] = '';

  if (optVendorize) {
    element.style[momentum.utils.getVendor(property)] = '';
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
 * @public
 * @see {goog.object.extend}
 * @param {Object} target
 * @param {...Object} var_args
 */
momentum.utils.extendObject = function(target, var_args) {
  var key;
  var source;
  var prorotypeFields = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ];

  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];

    for (key in source) {
      target[key] = source[key];
    }

    for (var j = 0; j < prorotypeFields.length; j++) {
      key = prorotypeFields[j];

      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};

/**
 * @public
 * @see {goog.dom.getAncestor}
 * @param {Node} element
 * @param {function(Node) : boolean} matcher
 * @param {boolean=} opt_includeNode
 * @param {number=} opt_maxSearchSteps
 * @return {Node}
 */
momentum.utils.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if (element && ! opt_includeNode) {
    element = element.parentNode;
  }

  var steps = 0;

  while (element && (opt_maxSearchSteps == null || steps <= opt_maxSearchSteps)) {
    if (matcher(element)) {
      return element;
    }

    element = element.parentNode;
    steps++;
  }

  return null;
};

/**
 * @public
 * @see {goog.dom.getAncestorByTagNameAndClass}
 * @param {Node} element
 * @param {string=} opt_tag
 * @return {?R}
 * @template T
 * @template R := cond(isUnknown(T), 'Element', T) =:
 */
momentum.utils.getAncestorByTagName = function(element, opt_tag) {
  if ( ! opt_tag) {
    return null;
  }

  var tagName = opt_tag ? String(opt_tag).toUpperCase() : null;

  return /** @type {Element} */ (momentum.utils.getAncestor(element, function(node) {
    return !tagName || node.nodeName == tagName;
  }, true));
};

/**
 * @public
 * @see {goog.dom.getOwnerDocument}
 * @param {Node|Window} node
 * @return {!Document}
 */
momentum.utils.getOwnerDocument = function(node) {
  return /** @type {!Document} */ (
    node.nodeType == Node.DOCUMENT_NODE ? node : node.ownerDocument || node.document);
};

/**
 * @public
 * @see {goog.dom.getDocumentScroll}
 * @return {momentum.Coordinate}
 */
momentum.utils.getDocumentScroll = function() {
  var element = document.scrollingElement || document.documentElement;

  return new momentum.Coordinate(
    window.pageXOffset || element.scrollLeft,
    window.pageYOffset || element.scrollTop
  );
};

/**
 * @public
 * @see {gogo.style.getPageOffset}
 * @param {Element} element
 * @return {momentum.Coordinate}
 */
momentum.utils.getPageOffset = function(element) {
  var ownerDoc = momentum.utils.getOwnerDocument(element);
  var offsetPosition = new momentum.Coordinate();
  var boundingRect = element.getBoundingClientRect();
  var scrollPosition = momentum.utils.getDocumentScroll();

  offsetPosition.x = boundingRect.left + scrollPosition.x;
  offsetPosition.y = boundingRect.top + scrollPosition.y;

  return offsetPosition;
};
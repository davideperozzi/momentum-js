goog.provide('momentum.utils');

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
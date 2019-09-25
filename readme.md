# momentum.js <a href="https://www.npmjs.com/package/momentum.js" target="_blank"><img src="https://badge.fury.io/js/momentum.js.svg"></a> <a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>

momenutm.js is a small (plainly written) JavaScript plugin, giving you the ability to add a "throw momentum effect" to anything displayed on your webpage. It can be a handy alternative to the Draggable extension of the greensock animation framework. Besides desktop devices it also works for mobile and touch devices.

## Installation

To use momentum.js you have to include the momentum.js file from the dist folder. If your server supports serving compressed files you can also put the compressed **gz** file in the same directory as the js file. This improves the loading time by **more than 50%**.
It also comes as a **npm** module:
```bash
npm install --save momentum.js
```

## Usage
### Webpack
To load it via Webpack, you could use the [exports-loader](https://github.com/webpack-contrib/exports-loader) like this:
```js
import momentum from 'exports-loader?momentum!momentum.js/dist/momentum.min.js'
```



## How to use the Draggable

The Draggable component allows your elements to be dragged around.

```javascript
new momentum.Draggable(element, config);
```

This example shows how to create a basic draggable element:

```javascript
new momentum.Draggable(dragElement, {
  container: containerElement,
  containerBounds: true,
  resizeUpdate: true,
  autoAnchor: true
});
```

### Some Draggable Demos
http://momentum.davide-perozzi.de/

### The Draggable configuration

| Option  | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| container  | Element  | null | Container of the draggable element. Also the target for the "drag events" |
| elementBounds | Element&#124;string | null | Determines if the bounds of a element should be used. As a shortcut you can pass 'container' or 'parent' as a string |
| bounds | Object | null | Set the bounds manually {x: number y: number, width: number, height: number} |
| autoAnchor | boolean | false | Determines if the anchor should be set on the start position the user has clicked |
| anchorX | number | 0.5 | The anchor point on the horizontal axis. |
| anchorY | number | 0.5 | The anchor point on the vertical axis. |
| threshold | number| 5 | The minimum velocity the element needs to reach to trigger the throw animation |
| restitution | number | 0 | The bounciness of the element if it hits the bounds. This will be multiplicated with the velocity. You can use negative values to let the element bounce out of the bounds. Numbers **from -1 to 1** are **valid**.
| friction | number | 0.035 | The friction of the element. Lower values make the elements decelerate longer. Numbers **from 0 to 1** are **valid** |
| offsetFriction | number | 0.1 | The friction used out of bounds. This will be included in the calculations if you used a negative restitution. Numbers **from 0 to 1** are **valid** |
| maxVelocity | number | 70 | The maximum velocity the element can reach. Numbers **greater than 0** are **valid**. |
| resizeUpdate | boolean | false | Determines whether the draggable should be updated automatically after the browser is resized. |
| lockAxis | Object | null | Locked axis will be excluded from the translation. For example: {x: false, y: true}. This will lock the y axis. |
| onUp | Function | null | Callback which will be called if the user released the element. |
| onDown | Function | null | Callback which will be called if the user hits the element before the drag. Whether you return true or false determimes if the drag will be accepted. If you want to **preserve the default behaviour** you should **return the "hit" parameter**. Parameter list: hit, cursorX, cursorY, elementX, elementY, elementWidth, elementHeight |
| onMove | Function | null | This will be triggered before the element is going to be moved. At this point the element does **not** have the latest translation. You can return an coordinate object like "{x: number, y: number}" to manipulate the position of the element. Parameter list: posX, posY, velX, velY. |
| onTranslate | Function | null | This will be called if the translation settled. Parameter list:  elementX, elementY, elementWidth, elementHeight, elementBounds |
| preventMove | Function | null | A function which needs to return wheter true or false to prevent the movement. This can be useful to add a move threshold. Paramter list: movedX, movedY, isTouchDevice

## License
momentum.js is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).

# Ultimate Element Inspector - The Bible Edition

> **Capture EVERYTHING about web elements for screen reader development and accessibility testing**

A comprehensive Tampermonkey userscript that provides deep inspection capabilities for web elements, specifically designed for accessibility professionals, screen reader developers, and web developers who need complete element diagnostics.

##  Features

### **Core Functionality**
- **Complete Element Bible**: Captures exhaustive information about any web element
- **Interactive Element Selection**: Click-to-capture with visual feedback
- **Real-time Panel**: Live view of captured elements with action buttons
- **Dynamic Tracking**: Monitors element changes using modern browser APIs

### **Comprehensive Data Capture**
- **♿ Full Accessibility Tree**: ARIA attributes, computed roles, accessible names/descriptions
- **Complete Geometry**: Position, dimensions, scroll properties, viewport coordinates
- **Exhaustive Styling**: Layout, box model, typography, flexbox/grid properties
- **Multiple Selectors**: XPath, CSS selectors, nth-child, data attributes
- **Context & Relationships**: Parent/child hierarchy, siblings, ancestor chains
- **Form Intelligence**: Validation states, constraints, labels, associated forms
- **Media Properties**: Image dimensions, video/audio states, canvas contexts
- **⚡ Performance Metrics**: Paint timing, layout shifts, memory usage
- **Interactive Properties**: Event listeners, focus states, editability
- **Browser-Specific Data**: Chrome DevTools integration, Shadow DOM, Web Components

### **Advanced Observers**
- **MutationObserver**: Tracks DOM changes in real-time
- **️ IntersectionObserver**: Monitors element visibility
- **ResizeObserver**: Detects size changes
- **⚡ PerformanceObserver**: Captures layout shifts and paint events

##  Installation

### Prerequisites
- [Tampermonkey](https://tampermonkey.net/) browser extension
- Modern browser (Chrome, Firefox, Safari, Edge)

### Install Steps
1. **Install Tampermonkey** extension in your browser
2. **Copy the script** from `Ultimate Element Inspector - The Bible Edition-2.0.user.js`
3. **Open Tampermonkey Dashboard** → Create new script
4. **Paste the code** and save
5. **Refresh any webpage** to activate

##  Usage Guide

### Getting Started
1. **Navigate to any webpage**
2. **Look for the draggable button** in the top-right corner: ` Start Bible Capture`
3. **Click to begin** element inspection mode

### Capturing Elements
1. **Click "Start Bible Capture"** - button turns red: ` Stop Bible Capture`
2. **Hover over elements** - see golden highlight and tooltip
3. **Click any element** - captures complete data with visual feedback
4. **Press Escape** or click stop button to end capture mode

### Using the Control Panel
The panel automatically appears during capture mode and shows:
- **Element count** and basic info
- **Action buttons** for each captured element:
  - ` Copy Bible` - Complete JSON data
  - ` Selectors` - All selector types
  - `♿ A11y` - Accessibility information
  - ` View` - Full element bible in new window
  - `✨ Highlight` - Scroll to and highlight element

### Panel Controls
- **Export All** - Download complete JSON file
- **Clear** - Remove all captured data
- **× Close** - Hide panel (reopens on next capture)

##  Data Structure

The script captures data in the following categories:

### Meta Information
```json
{
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "captureId": "capture_1737024600000",
    "url": "https://example.com",
    "userAgent": "Mozilla/5.0...",
    "viewport": { "width": 1920, "height": 1080 }
  }
}
```

### Basic Element Data
- Tag name, ID, classes, node properties
- Text content, inner/outer HTML
- All attributes as key-value pairs

### Accessibility Information
- **Computed Role**: ARIA role (explicit or implicit)
- **Accessible Name**: Following ARIA specification
- **Accessible Description**: aria-describedby, aria-description
- **ARIA Attributes**: All aria-* properties
- **Focus Information**: Tab index, focusability, current focus
- **State Properties**: Hidden, expanded, selected, checked, disabled

### Geometry & Position
- **Bounding Rectangle**: Top, left, width, height, x, y
- **Offset Properties**: Relative to offset parent
- **Scroll Properties**: Current scroll position and dimensions
- **Client Properties**: Inner dimensions
- **Screen/Page Position**: Absolute coordinates

### Comprehensive Styling
- **Layout**: Display, position, float, dimensions
- **Box Model**: Margins, padding, borders
- **Visual**: Opacity, visibility, transforms, filters
- **Typography**: Font properties, text styling
- **Flexbox/Grid**: All flex and grid properties
- **Colors/Backgrounds**: All visual styling

### Selectors (Multiple Types)
- **ID Selector**: `#element-id`
- **Class Selector**: `.class1.class2`
- **XPath**: Full XPath expression
- **CSS Selector**: Complete CSS path
- **Nth-child**: Position-based selector
- **Data Attributes**: All data-* selectors

### Context & Relationships
- **Parent Information**: Tag, ID, classes, role
- **Children Array**: All direct child elements
- **Sibling Information**: Previous/next siblings
- **Ancestor Chain**: Up to 10 parent elements
- **Descendant Count**: Total nested elements

##  Interface Features

### Draggable Controls
- **Draggable Button**: Move the control button anywhere on screen
- **Smart Dragging**: Distinguishes between drag and click
- **Viewport Constraints**: Stays within browser window

### Visual Feedback
- **Golden Highlights**: Elements glow when hovered/captured
- **Smooth Animations**: Hover effects and transitions
- **Audio Feedback**: Capture sound (when supported)
- **Status Notifications**: Temporary success/error messages

### Professional Styling
- **Gradient Backgrounds**: Modern purple/blue themes
- **Backdrop Blur**: Glass-morphism effects
- **Responsive Design**: Works on different screen sizes
- **Print Support**: Clean printing for documentation

##  Technical Details

### Browser Compatibility
- **Chrome**: Full feature support including DevTools integration
- **Firefox**: Complete functionality
- **Safari**: Core features supported
- **Edge**: Full compatibility

### Performance Considerations
- **Efficient Observers**: Only active during capture mode
- **Memory Management**: Automatic cleanup of references
- **Selective Data**: Large objects are truncated appropriately
- **Error Handling**: Graceful degradation for unsupported features

### Security Features
- **No External Requests**: Everything runs locally
- **Safe Data Handling**: Prevents circular references
- **Clean Exports**: Removes DOM references from exported data

##  Use Cases

### Accessibility Testing
- **Screen Reader Development**: Complete element context
- **ARIA Implementation**: Verify computed accessibility tree
- **Focus Management**: Test keyboard navigation
- **Color Contrast**: Extract all color information

### Web Development
- **CSS Debugging**: Complete computed style information
- **Layout Analysis**: Box model and positioning data
- **Performance Optimization**: Layout shift and paint metrics
- **Responsive Testing**: Viewport and dimension tracking

### Quality Assurance
- **Element Documentation**: Complete element specifications
- **Regression Testing**: Compare element states over time
- **Cross-browser Testing**: Capture browser-specific differences
- **Automation Support**: Generate reliable selectors

##  Advanced Features

### Dynamic Element Tracking
- **Mutation Monitoring**: Track DOM changes over time
- **Visibility Tracking**: Monitor when elements enter/leave viewport
- **Size Monitoring**: Detect element resize events
- **Performance Tracking**: Capture layout shifts and paint events

### Export Capabilities
- **JSON Export**: Complete structured data
- **Print-Friendly**: Clean documentation format
- **Clipboard Integration**: Copy specific data types
- **Batch Processing**: Export multiple elements at once

### Browser Integration
- **DevTools Compatibility**: Works alongside browser dev tools
- **Extension Integration**: Detects Chrome extension context
- **Shadow DOM Support**: Handles web components
- **Custom Elements**: Identifies and analyzes custom elements

##  Tips & Best Practices

### Effective Usage
1. **Start with Simple Elements**: Test with buttons/links first
2. **Use Hover Preview**: Check element info before capturing
3. **Organize Captures**: Use Clear button between different test scenarios
4. **Export Regularly**: Save data for documentation and analysis

### Performance Tips
1. **Capture Selectively**: Don't capture every element on complex pages
2. **Clear Data**: Regular cleanup prevents memory buildup
3. **Use Escape**: Quick way to stop capture mode
4. **Check Console**: Monitor for any warning messages

### Troubleshooting
- **Blank View Window**: Check popup blockers
- **Copy Failures**: Try different browsers or use fallback methods
- **Missing Data**: Some properties may not be available in all browsers
- **Performance Issues**: Clear captured data on complex pages

##  Output Examples

### Basic Element Capture
```json
{
  "basic": {
    "tagName": "button",
    "id": "submit-btn",
    "className": "btn btn-primary",
    "textContent": "Submit Form"
  },
  "accessibility": {
    "computedRole": "button",
    "computedName": "Submit Form",
    "focusInfo": {
      "isFocusable": true,
      "tabIndex": 0
    }
  }
}
```

### Complex Form Element
```json
{
  "formInfo": {
    "type": "email",
    "name": "user_email",
    "required": true,
    "validation": {
      "validity": {
        "valid": false,
        "valueMissing": true
      },
      "validationMessage": "Please fill out this field."
    }
  }
}
```

##  Contributing

This script is designed for accessibility professionals and web developers. Feel free to:
- Report issues or bugs
- Suggest new features
- Share use cases and examples
- Contribute improvements

// ==UserScript==
// @name         Ultimate Element Inspector - The Bible Edition
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Capture EVERYTHING about elements for screen reader development
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isCapturing = false;
    let capturedElements = [];
    let overlay = null;
    let infoPanel = null;
    let mutationObserver = null;
    let intersectionObserver = null;
    let resizeObserver = null;
    let performanceObserver = null;
    let elementMutations = new Map();
    let elementVisibility = new Map();

    // Enhanced accessibility tree walker
    function getAccessibilityTree(element) {
        const accessibilityInfo = {
            computedRole: null,
            computedName: null,
            computedDescription: null,
            accessibleNode: null
        };

        try {
            // Try to get computed accessibility info (Chrome specific)
            if (window.getComputedAccessibleNode) {
                accessibilityInfo.accessibleNode = window.getComputedAccessibleNode(element);
            }

            // Manual computation of accessible name
            accessibilityInfo.computedName = getAccessibleName(element);
            accessibilityInfo.computedDescription = getAccessibleDescription(element);
            accessibilityInfo.computedRole = getComputedRole(element);

        } catch (e) {
            console.warn('Accessibility API error:', e);
        }

        return accessibilityInfo;
    }

    // Compute accessible name following ARIA specification
    function getAccessibleName(element) {
        // Check aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labels = labelledBy.split(' ').map(id => document.getElementById(id)).filter(Boolean);
            if (labels.length) {
                return labels.map(label => label.textContent.trim()).join(' ');
            }
        }

        // Check aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) {
            return ariaLabel.trim();
        }

        // Check associated labels for form controls
        if (element.labels && element.labels.length) {
            return Array.from(element.labels).map(label => label.textContent.trim()).join(' ');
        }

        // Check title attribute
        const title = element.getAttribute('title');
        if (title && title.trim()) {
            return title.trim();
        }

        // Check alt for images
        if (element.tagName.toLowerCase() === 'img') {
            const alt = element.getAttribute('alt');
            if (alt !== null) return alt.trim();
        }

        // Check placeholder for inputs
        if (element.tagName.toLowerCase() === 'input') {
            const placeholder = element.getAttribute('placeholder');
            if (placeholder && placeholder.trim()) {
                return placeholder.trim();
            }
        }

        // Fall back to text content for certain elements
        const textElements = ['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (textElements.includes(element.tagName.toLowerCase())) {
            return element.textContent.trim();
        }

        return '';
    }

    // Compute accessible description
    function getAccessibleDescription(element) {
        const describedBy = element.getAttribute('aria-describedby');
        if (describedBy) {
            const descriptions = describedBy.split(' ').map(id => document.getElementById(id)).filter(Boolean);
            if (descriptions.length) {
                return descriptions.map(desc => desc.textContent.trim()).join(' ');
            }
        }

        const ariaDescription = element.getAttribute('aria-description');
        if (ariaDescription && ariaDescription.trim()) {
            return ariaDescription.trim();
        }

        return '';
    }

    // Compute ARIA role
    function getComputedRole(element) {
        const explicitRole = element.getAttribute('role');
        if (explicitRole) return explicitRole;

        // Implicit roles based on element type
        const tagName = element.tagName.toLowerCase();
        const implicitRoles = {
            'button': 'button',
            'a': element.href ? 'link' : 'generic',
            'input': getInputRole(element),
            'img': element.alt !== null ? 'img' : 'presentation',
            'h1': 'heading', 'h2': 'heading', 'h3': 'heading', 'h4': 'heading', 'h5': 'heading', 'h6': 'heading',
            'nav': 'navigation',
            'main': 'main',
            'section': 'region',
            'article': 'article',
            'aside': 'complementary',
            'header': 'banner',
            'footer': 'contentinfo',
            'form': 'form',
            'table': 'table',
            'tr': 'row',
            'td': 'cell',
            'th': 'columnheader',
            'ul': 'list',
            'ol': 'list',
            'li': 'listitem',
            'dialog': 'dialog',
            'select': 'combobox',
            'textarea': 'textbox'
        };

        return implicitRoles[tagName] || 'generic';
    }

    function getInputRole(input) {
        const type = input.type?.toLowerCase() || 'text';
        const inputRoles = {
            'button': 'button',
            'checkbox': 'checkbox',
            'radio': 'radio',
            'range': 'slider',
            'search': 'searchbox',
            'text': 'textbox',
            'email': 'textbox',
            'password': 'textbox',
            'tel': 'textbox',
            'url': 'textbox',
            'number': 'spinbutton'
        };
        return inputRoles[type] || 'textbox';
    }

    // Setup observers for dynamic tracking
    function setupObservers() {
        // Mutation Observer for DOM changes
        mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target && capturedElements.some(el => el.element === mutation.target)) {
                    const elementId = getElementId(mutation.target);
                    if (!elementMutations.has(elementId)) {
                        elementMutations.set(elementId, []);
                    }
                    elementMutations.get(elementId).push({
                        type: mutation.type,
                        timestamp: Date.now(),
                        addedNodes: Array.from(mutation.addedNodes).map(node => node.nodeName),
                        removedNodes: Array.from(mutation.removedNodes).map(node => node.nodeName),
                        attributeName: mutation.attributeName,
                        oldValue: mutation.oldValue
                    });
                }
            });
        });

        // Intersection Observer for visibility tracking
        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const elementId = getElementId(entry.target);
                elementVisibility.set(elementId, {
                    isIntersecting: entry.isIntersecting,
                    intersectionRatio: entry.intersectionRatio,
                    boundingClientRect: entry.boundingClientRect,
                    intersectionRect: entry.intersectionRect,
                    rootBounds: entry.rootBounds,
                    timestamp: entry.time
                });
            });
        });

        // Resize Observer for size changes
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    const elementId = getElementId(entry.target);
                    if (!elementMutations.has(elementId)) {
                        elementMutations.set(elementId, []);
                    }
                    elementMutations.get(elementId).push({
                        type: 'resize',
                        timestamp: Date.now(),
                        contentRect: entry.contentRect,
                        borderBoxSize: entry.borderBoxSize,
                        contentBoxSize: entry.contentBoxSize
                    });
                });
            });
        }

        // Performance Observer for layout shifts and paint timing
        if (window.PerformanceObserver) {
            try {
                performanceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.entryType === 'layout-shift' || entry.entryType === 'paint') {
                            console.log('Performance entry:', entry);
                        }
                    });
                });
                performanceObserver.observe({ entryTypes: ['layout-shift', 'paint', 'measure'] });
            } catch (e) {
                console.warn('Performance Observer not supported:', e);
            }
        }

        // Start observing
        mutationObserver.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeOldValue: true,
            characterData: true,
            characterDataOldValue: true
        });
    }

    function getElementId(element) {
        return element.id || `${element.tagName.toLowerCase()}-${Array.from(element.parentNode?.children || []).indexOf(element)}`;
    }

    // Get browser-specific accessibility info
    function getBrowserAccessibilityInfo(element) {
        const info = {};

        try {
            // Chrome DevTools accessibility info
            if (window.chrome && chrome.runtime) {
                info.chromeAccessibility = 'Chrome extension context detected';
            }

            // Check if element has focus
            info.hasFocus = document.activeElement === element;

            // Check if element is keyboard navigable
            info.isKeyboardNavigable = element.tabIndex >= 0 ||
                ['a', 'button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());

            // Get all event listeners (if possible)
            if (getEventListeners) {
                info.eventListeners = getEventListeners(element);
            }

            // Shadow DOM information
            if (element.shadowRoot) {
                info.shadowDOM = {
                    mode: element.shadowRoot.mode,
                    childElementCount: element.shadowRoot.childElementCount,
                    innerHTML: element.shadowRoot.innerHTML.substring(0, 500)
                };
            }

            // Web Components info
            if (element.tagName.includes('-')) {
                info.isCustomElement = true;
                info.customElementRegistry = customElements.get(element.tagName.toLowerCase());
            }

        } catch (e) {
            info.error = e.message;
        }

        return info;
    }

    // Get comprehensive styling information
    function getComprehensiveStyles(element) {
        const computedStyle = window.getComputedStyle(element);
        const styles = {};

        // Layout properties
        styles.layout = {
            display: computedStyle.display,
            position: computedStyle.position,
            float: computedStyle.float,
            clear: computedStyle.clear,
            top: computedStyle.top,
            right: computedStyle.right,
            bottom: computedStyle.bottom,
            left: computedStyle.left,
            width: computedStyle.width,
            height: computedStyle.height,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight,
            maxWidth: computedStyle.maxWidth,
            maxHeight: computedStyle.maxHeight
        };

        // Box model
        styles.boxModel = {
            margin: {
                top: computedStyle.marginTop,
                right: computedStyle.marginRight,
                bottom: computedStyle.marginBottom,
                left: computedStyle.marginLeft
            },
            padding: {
                top: computedStyle.paddingTop,
                right: computedStyle.paddingRight,
                bottom: computedStyle.paddingBottom,
                left: computedStyle.paddingLeft
            },
            border: {
                top: computedStyle.borderTop,
                right: computedStyle.borderRight,
                bottom: computedStyle.borderBottom,
                left: computedStyle.borderLeft,
                radius: computedStyle.borderRadius
            }
        };

        // Visual properties
        styles.visual = {
            opacity: computedStyle.opacity,
            visibility: computedStyle.visibility,
            zIndex: computedStyle.zIndex,
            transform: computedStyle.transform,
            filter: computedStyle.filter,
            mixBlendMode: computedStyle.mixBlendMode,
            isolation: computedStyle.isolation
        };

        // Colors and backgrounds
        styles.appearance = {
            color: computedStyle.color,
            backgroundColor: computedStyle.backgroundColor,
            backgroundImage: computedStyle.backgroundImage,
            backgroundSize: computedStyle.backgroundSize,
            backgroundPosition: computedStyle.backgroundPosition,
            backgroundRepeat: computedStyle.backgroundRepeat,
            boxShadow: computedStyle.boxShadow,
            textShadow: computedStyle.textShadow
        };

        // Typography
        styles.typography = {
            fontFamily: computedStyle.fontFamily,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
            fontStyle: computedStyle.fontStyle,
            lineHeight: computedStyle.lineHeight,
            letterSpacing: computedStyle.letterSpacing,
            wordSpacing: computedStyle.wordSpacing,
            textAlign: computedStyle.textAlign,
            textDecoration: computedStyle.textDecoration,
            textTransform: computedStyle.textTransform,
            whiteSpace: computedStyle.whiteSpace,
            wordWrap: computedStyle.wordWrap,
            textOverflow: computedStyle.textOverflow
        };

        // Flexbox/Grid
        styles.flexGrid = {
            display: computedStyle.display,
            flexDirection: computedStyle.flexDirection,
            flexWrap: computedStyle.flexWrap,
            justifyContent: computedStyle.justifyContent,
            alignItems: computedStyle.alignItems,
            alignContent: computedStyle.alignContent,
            flexGrow: computedStyle.flexGrow,
            flexShrink: computedStyle.flexShrink,
            flexBasis: computedStyle.flexBasis,
            gridTemplate: computedStyle.gridTemplate,
            gridArea: computedStyle.gridArea
        };

        return styles;
    }

    // Get performance metrics for the element
    function getPerformanceMetrics(element) {
        const metrics = {};

        try {
            // Paint timing
            const paintEntries = performance.getEntriesByType('paint');
            metrics.paintTiming = paintEntries;

            // Layout shift information
            const layoutShifts = performance.getEntriesByType('layout-shift');
            metrics.layoutShifts = layoutShifts;

            // Element timing (if supported)
            if ('elementTiming' in element) {
                metrics.elementTiming = element.elementTiming;
            }

            // Memory usage (if available)
            if (performance.memory) {
                metrics.memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }

        } catch (e) {
            metrics.error = e.message;
        }

        return metrics;
    }

    // Create the main toggle button (now draggable!)
    function createToggleButton() {
        const button = document.createElement('button');
        button.id = 'element-inspector-toggle';
        button.innerHTML = '📖 Start Bible Capture';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 12px 18px;
            border-radius: 8px;
            cursor: move;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            font-family: 'Segoe UI', sans-serif;
            user-select: none;
            touch-action: none;
        `;

        // Make the button draggable
        makeDraggable(button);

        button.addEventListener('click', (e) => {
            // Prevent click if we just finished dragging
            if (button.isDragging || button.justDragged) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            toggleCapturing();
        });
        button.addEventListener('mouseenter', () => {
            if (!button.isDragging) {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            }
        });
        button.addEventListener('mouseleave', () => {
            if (!button.isDragging) {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            }
        });

        document.body.appendChild(button);
        return button;
    }

    // Make any element draggable
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);

        function startDrag(e) {
            const event = e.type === 'touchstart' ? e.touches[0] : e;

            // Only start drag if we hold for a moment or move
            const startTime = Date.now();
            startX = event.clientX;
            startY = event.clientY;

            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            const moveHandler = (moveEvent) => {
                const currentEvent = moveEvent.type === 'touchmove' ? moveEvent.touches[0] : moveEvent;
                const deltaX = Math.abs(currentEvent.clientX - startX);
                const deltaY = Math.abs(currentEvent.clientY - startY);
                const deltaTime = Date.now() - startTime;

                // Start dragging if moved enough or held long enough
                if (!isDragging && (deltaX > 5 || deltaY > 5 || deltaTime > 200)) {
                    isDragging = true;
                    element.isDragging = true;
                    element.style.cursor = 'grabbing';
                    element.style.transform = 'scale(1.05)';
                    element.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)';

                    // Add visual feedback
                    element.style.opacity = '0.9';
                    document.body.style.userSelect = 'none';
                }

                if (isDragging) {
                    moveEvent.preventDefault();
                    moveEvent.stopPropagation();

                    // Mark that we're actively dragging
                    element.justDragged = true;

                    const newX = initialX + (currentEvent.clientX - startX);
                    const newY = initialY + (currentEvent.clientY - startY);

                    // Keep button within viewport bounds
                    const maxX = window.innerWidth - element.offsetWidth;
                    const maxY = window.innerHeight - element.offsetHeight;

                    const clampedX = Math.max(0, Math.min(newX, maxX));
                    const clampedY = Math.max(0, Math.min(newY, maxY));

                    element.style.left = clampedX + 'px';
                    element.style.top = clampedY + 'px';
                    element.style.right = 'auto';
                    element.style.bottom = 'auto';
                }
            };

            const endHandler = () => {
                if (isDragging) {
                    // Reset styles
                    element.style.cursor = 'move';
                    element.style.transform = 'scale(1)';
                    element.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                    element.style.opacity = '1';
                    document.body.style.userSelect = '';

                    // Small delay before allowing clicks again
                    setTimeout(() => {
                        isDragging = false;
                        element.isDragging = false;
                        element.justDragged = false;
                    }, 150);
                } else {
                    // If we didn't drag, it's a click
                    isDragging = false;
                    element.isDragging = false;
                    element.justDragged = false;
                }

                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', endHandler);
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('touchend', endHandler);
            };

            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', endHandler);
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler);
        }
    }

    // Create enhanced info panel
    function createInfoPanel() {
        const panel = document.createElement('div');
        panel.id = 'element-inspector-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 450px;
            max-height: 600px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10001;
            display: none;
            overflow: hidden;
            font-family: 'Segoe UI', sans-serif;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            background: rgba(0,0,0,0.2);
            color: white;
            padding: 15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
        `;
        header.innerHTML = `
            <span>📖 Captured Elements (${capturedElements.length})</span>
            <div>
                <button id="export-data" style="background: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin-right: 5px; cursor: pointer;">Export All</button>
                <button id="clear-data" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin-right: 5px; cursor: pointer;">Clear</button>
                <button id="close-panel" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">×</button>
            </div>
        `;

        const content = document.createElement('div');
        content.id = 'panel-content';
        content.style.cssText = `
            max-height: 500px;
            overflow-y: auto;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
        `;

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        // Event listeners for panel buttons
        document.getElementById('export-data').addEventListener('click', exportAllData);
        document.getElementById('clear-data').addEventListener('click', clearCapturedData);
        document.getElementById('close-panel').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        return panel;
    }

    // Create visual overlay for highlighting
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'element-inspector-overlay';
        overlay.style.cssText = `
            position: absolute;
            background: rgba(255, 215, 0, 0.3);
            border: 3px solid gold;
            pointer-events: none;
            z-index: 9999;
            display: none;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // Get ULTIMATE element information - THE BIBLE
    function getElementInfo(element) {
        const rect = element.getBoundingClientRect();
        const timestamp = Date.now();

        return {
            // Meta information
            meta: {
                timestamp: new Date().toISOString(),
                captureId: `capture_${timestamp}`,
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            },

            // Basic element info
            basic: {
                tagName: element.tagName.toLowerCase(),
                id: element.id,
                className: element.className,
                nodeName: element.nodeName,
                nodeType: element.nodeType,
                textContent: element.textContent?.trim() || '',
                innerText: element.innerText?.trim() || '',
                innerHTML: element.innerHTML?.substring(0, 500) || '',
                outerHTML: element.outerHTML?.substring(0, 1000) || ''
            },

            // Position and dimensions (COMPREHENSIVE)
            geometry: {
                boundingClientRect: {
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    x: rect.x,
                    y: rect.y
                },
                offsetProperties: {
                    offsetTop: element.offsetTop,
                    offsetLeft: element.offsetLeft,
                    offsetWidth: element.offsetWidth,
                    offsetHeight: element.offsetHeight,
                    offsetParent: element.offsetParent?.tagName || null
                },
                scrollProperties: {
                    scrollTop: element.scrollTop,
                    scrollLeft: element.scrollLeft,
                    scrollWidth: element.scrollWidth,
                    scrollHeight: element.scrollHeight
                },
                clientProperties: {
                    clientTop: element.clientTop,
                    clientLeft: element.clientLeft,
                    clientWidth: element.clientWidth,
                    clientHeight: element.clientHeight
                },
                screenPosition: {
                    screenX: rect.left + window.screenX,
                    screenY: rect.top + window.screenY
                },
                pagePosition: {
                    pageX: rect.left + window.pageXOffset,
                    pageY: rect.top + window.pageYOffset
                }
            },

            // ALL attributes
            attributes: Array.from(element.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
            }, {}),

            // ULTIMATE accessibility information
            accessibility: {
                ...getAccessibilityTree(element),
                ariaAttributes: Array.from(element.attributes)
                    .filter(attr => attr.name.startsWith('aria-'))
                    .reduce((acc, attr) => {
                        acc[attr.name] = attr.value;
                        return acc;
                    }, {}),
                roleInfo: {
                    explicitRole: element.getAttribute('role'),
                    computedRole: getComputedRole(element),
                    implicitRole: getComputedRole(element)
                },
                labelInfo: {
                    ariaLabel: element.getAttribute('aria-label'),
                    ariaLabelledBy: element.getAttribute('aria-labelledby'),
                    ariaDescribedBy: element.getAttribute('aria-describedby'),
                    computedName: getAccessibleName(element),
                    computedDescription: getAccessibleDescription(element)
                },
                stateProperties: {
                    ariaHidden: element.getAttribute('aria-hidden'),
                    ariaExpanded: element.getAttribute('aria-expanded'),
                    ariaSelected: element.getAttribute('aria-selected'),
                    ariaChecked: element.getAttribute('aria-checked'),
                    ariaDisabled: element.getAttribute('aria-disabled'),
                    ariaBusy: element.getAttribute('aria-busy'),
                    ariaLive: element.getAttribute('aria-live')
                },
                relationships: {
                    ariaOwns: element.getAttribute('aria-owns'),
                    ariaControls: element.getAttribute('aria-controls'),
                    ariaFlowTo: element.getAttribute('aria-flowto'),
                    ariaActiveDescendant: element.getAttribute('aria-activedescendant')
                },
                focusInfo: {
                    tabIndex: element.tabIndex,
                    isFocusable: element.tabIndex >= 0,
                    hasFocus: document.activeElement === element,
                    canReceiveFocus: element.tabIndex >= 0 || ['a', 'button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())
                }
            },

            // Browser-specific accessibility
            browserAccessibility: getBrowserAccessibilityInfo(element),

            // COMPREHENSIVE styling
            styles: getComprehensiveStyles(element),

            // Selectors (multiple types)
            selectors: {
                id: element.id ? `#${element.id}` : null,
                className: element.className ? `.${element.className.split(' ').join('.')}` : null,
                xpath: getXPath(element),
                cssSelector: getCSSSelector(element),
                nthChild: getNthChildSelector(element),
                dataAttributes: getDataAttributeSelectors(element)
            },

            // Form-specific information
            formInfo: getFormInfo(element),

            // Media-specific information
            mediaInfo: getMediaInfo(element),

            // Interactive properties
            interaction: {
                clickable: isClickable(element),
                editable: isEditable(element),
                draggable: element.draggable,
                hasEventListeners: hasEventListeners(element),
                disabled: element.disabled,
                readonly: element.readOnly,
                required: element.required,
                contentEditable: element.contentEditable
            },

            // Parent/child context
            context: {
                parent: element.parentElement ? {
                    tagName: element.parentElement.tagName.toLowerCase(),
                    id: element.parentElement.id,
                    className: element.parentElement.className,
                    role: element.parentElement.getAttribute('role')
                } : null,
                children: Array.from(element.children).map(child => ({
                    tagName: child.tagName.toLowerCase(),
                    id: child.id,
                    className: child.className
                })),
                siblings: getSiblingInfo(element),
                ancestors: getAncestorChain(element),
                descendantCount: element.querySelectorAll('*').length
            },

            // Performance metrics
            performance: getPerformanceMetrics(element),

            // Dynamic tracking data
            dynamicData: {
                mutations: elementMutations.get(getElementId(element)) || [],
                visibility: elementVisibility.get(getElementId(element)) || null,
                observerStatus: {
                    mutationObserved: mutationObserver !== null,
                    intersectionObserved: intersectionObserver !== null,
                    resizeObserved: resizeObserver !== null
                }
            },

            // Additional metadata
            metadata: {
                isCustomElement: element.tagName.includes('-'),
                hasShadowRoot: !!element.shadowRoot,
                isConnected: element.isConnected,
                baseURI: element.baseURI,
                lang: element.lang,
                dir: element.dir,
                title: element.title,
                dataset: Object.assign({}, element.dataset)
            }
        };
    }

    // Helper functions for comprehensive data collection
    function getXPath(element) {
        if (element.id) return `//*[@id="${element.id}"]`;
        if (element === document.body) return '/html/body';

        let ix = 0;
        const siblings = element.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }

    function getCSSSelector(element) {
        if (element.id) return `#${element.id}`;

        let selector = element.tagName.toLowerCase();
        if (element.className) {
            selector += '.' + element.className.split(' ').filter(c => c).join('.');
        }

        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            let parentSelector = parent.tagName.toLowerCase();
            if (parent.id) {
                return `#${parent.id} ${selector}`;
            }
            if (parent.className) {
                parentSelector += '.' + parent.className.split(' ').filter(c => c).join('.');
            }
            selector = `${parentSelector} > ${selector}`;
            parent = parent.parentElement;
        }

        return selector;
    }

    function getNthChildSelector(element) {
        const parent = element.parentElement;
        if (!parent) return null;

        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    function getDataAttributeSelectors(element) {
        const dataAttrs = {};
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                dataAttrs[attr.name] = `[${attr.name}="${attr.value}"]`;
            }
        });
        return dataAttrs;
    }

    function getFormInfo(element) {
        if (!['input', 'select', 'textarea', 'button', 'form'].includes(element.tagName.toLowerCase())) {
            return null;
        }

        return {
            type: element.type,
            name: element.name,
            value: element.value,
            checked: element.checked,
            selected: element.selected,
            multiple: element.multiple,
            form: element.form ? {
                id: element.form.id,
                name: element.form.name,
                action: element.form.action,
                method: element.form.method
            } : null,
            labels: element.labels ? Array.from(element.labels).map(label => ({
                id: label.id,
                textContent: label.textContent.trim()
            })) : [],
            validation: {
                validity: element.validity ? {
                    valid: element.validity.valid,
                    valueMissing: element.validity.valueMissing,
                    typeMismatch: element.validity.typeMismatch,
                    patternMismatch: element.validity.patternMismatch,
                    tooLong: element.validity.tooLong,
                    tooShort: element.validity.tooShort,
                    rangeUnderflow: element.validity.rangeUnderflow,
                    rangeOverflow: element.validity.rangeOverflow,
                    stepMismatch: element.validity.stepMismatch,
                    badInput: element.validity.badInput,
                    customError: element.validity.customError
                } : null,
                validationMessage: element.validationMessage,
                willValidate: element.willValidate,
                constraints: {
                    required: element.required,
                    pattern: element.pattern,
                    min: element.min,
                    max: element.max,
                    step: element.step,
                    minLength: element.minLength,
                    maxLength: element.maxLength
                }
            }
        };
    }

    function getMediaInfo(element) {
        const tagName = element.tagName.toLowerCase();
        if (!['img', 'video', 'audio', 'canvas', 'svg', 'picture', 'source'].includes(tagName)) {
            return null;
        }

        const mediaInfo = {
            tagName: tagName,
            src: element.src,
            alt: element.alt,
            title: element.title
        };

        if (tagName === 'img') {
            mediaInfo.naturalWidth = element.naturalWidth;
            mediaInfo.naturalHeight = element.naturalHeight;
            mediaInfo.complete = element.complete;
            mediaInfo.loading = element.loading;
            mediaInfo.decoding = element.decoding;
            mediaInfo.sizes = element.sizes;
            mediaInfo.srcset = element.srcset;
        }

        if (tagName === 'video' || tagName === 'audio') {
            mediaInfo.duration = element.duration;
            mediaInfo.currentTime = element.currentTime;
            mediaInfo.paused = element.paused;
            mediaInfo.muted = element.muted;
            mediaInfo.volume = element.volume;
            mediaInfo.playbackRate = element.playbackRate;
            mediaInfo.controls = element.controls;
            mediaInfo.autoplay = element.autoplay;
            mediaInfo.loop = element.loop;
            mediaInfo.preload = element.preload;
        }

        if (tagName === 'canvas') {
            mediaInfo.width = element.width;
            mediaInfo.height = element.height;
            try {
                mediaInfo.context2d = !!element.getContext('2d');
                mediaInfo.contextWebgl = !!element.getContext('webgl');
            } catch (e) {
                mediaInfo.contextError = e.message;
            }
        }

        return mediaInfo;
    }

    function isClickable(element) {
        const clickableElements = ['a', 'button', 'input', 'select', 'textarea', 'label'];
        return clickableElements.includes(element.tagName.toLowerCase()) ||
               element.onclick !== null ||
               element.getAttribute('role') === 'button' ||
               element.tabIndex >= 0;
    }

    function isEditable(element) {
        const editableElements = ['input', 'textarea', 'select'];
        return editableElements.includes(element.tagName.toLowerCase()) ||
               element.contentEditable === 'true' ||
               element.isContentEditable;
    }

    function hasEventListeners(element) {
        // Check for common event handler attributes
        const eventAttributes = [
            'onclick', 'onchange', 'onsubmit', 'onload', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress'
        ];

        return eventAttributes.some(attr => element[attr] !== null) ||
               element.getAttribute('onclick') !== null;
    }

    function getSiblingInfo(element) {
        const parent = element.parentElement;
        if (!parent) return { previous: null, next: null, total: 0 };

        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element);

        return {
            previous: index > 0 ? {
                tagName: siblings[index - 1].tagName.toLowerCase(),
                id: siblings[index - 1].id,
                className: siblings[index - 1].className
            } : null,
            next: index < siblings.length - 1 ? {
                tagName: siblings[index + 1].tagName.toLowerCase(),
                id: siblings[index + 1].id,
                className: siblings[index + 1].className
            } : null,
            total: siblings.length,
            position: index + 1
        };
    }

    function getAncestorChain(element) {
        const ancestors = [];
        let current = element.parentElement;

        while (current && current !== document.body && ancestors.length < 10) {
            ancestors.push({
                tagName: current.tagName.toLowerCase(),
                id: current.id,
                className: current.className,
                role: current.getAttribute('role')
            });
            current = current.parentElement;
        }

        return ancestors;
    }

    // Handle element clicks during capture mode
    function handleElementClick(event) {
        if (!isCapturing) return;

        // Don't interfere with our control buttons
        if (event.target.id === 'element-inspector-toggle' ||
            event.target.closest('#element-inspector-panel')) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        // Start observing this element for dynamic changes
        if (intersectionObserver) {
            intersectionObserver.observe(event.target);
        }
        if (resizeObserver) {
            resizeObserver.observe(event.target);
        }

        const elementInfo = getElementInfo(event.target);
        elementInfo.element = event.target; // Store reference for observers
        capturedElements.push(elementInfo);

        // Enhanced visual feedback
        const originalStyles = {
            background: event.target.style.backgroundColor,
            border: event.target.style.border,
            boxShadow: event.target.style.boxShadow
        };

        event.target.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
        event.target.style.border = '3px solid gold';
        event.target.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';

        setTimeout(() => {
            event.target.style.backgroundColor = originalStyles.background;
            event.target.style.border = originalStyles.border;
            event.target.style.boxShadow = originalStyles.boxShadow;
        }, 500);

        updateInfoPanel();

        // Update button with capture count but keep stop functionality
        document.getElementById('element-inspector-toggle').innerHTML = `🛑 Stop Capturing (${capturedElements.length})`;

        // Play capture sound (if supported)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported, silent fail
        }
    }

    // Enhanced mouse over for highlighting
    function handleMouseOver(event) {
        if (!isCapturing) return;

        const rect = event.target.getBoundingClientRect();
        overlay.style.cssText = `
            position: absolute;
            background: rgba(255, 215, 0, 0.3);
            border: 3px solid gold;
            pointer-events: none;
            z-index: 9999;
            display: block;
            left: ${rect.left + window.scrollX}px;
            top: ${rect.top + window.scrollY}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
            transition: all 0.1s ease;
        `;

        // Show element info tooltip
        const tooltip = document.getElementById('hover-tooltip') || createHoverTooltip();
        const elementInfo = `${event.target.tagName.toLowerCase()}${event.target.id ? '#' + event.target.id : ''}${event.target.className ? '.' + event.target.className.split(' ').join('.') : ''}`;
        tooltip.textContent = elementInfo;
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.top + window.scrollY - 30) + 'px';
        tooltip.style.display = 'block';
    }

    function createHoverTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'hover-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-family: monospace;
            z-index: 10000;
            pointer-events: none;
            display: none;
            white-space: nowrap;
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }

    // Handle mouse out
    function handleMouseOut(event) {
        if (!isCapturing) return;
        overlay.style.display = 'none';
        const tooltip = document.getElementById('hover-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }

    // Toggle capturing mode
    function toggleCapturing() {
        const button = document.getElementById('element-inspector-toggle');

        if (!isCapturing) {
            isCapturing = true;
            button.innerHTML = '🛑 Stop Bible Capture';
            button.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';

            // Setup all observers
            setupObservers();

            // Add event listeners
            document.addEventListener('click', handleElementClick, true);
            document.addEventListener('mouseover', handleMouseOver, true);
            document.addEventListener('mouseout', handleMouseOut, true);

            // Show info panel
            if (!infoPanel) {
                infoPanel = createInfoPanel();
            }
            infoPanel.style.display = 'block';

            // Add escape key to stop capturing
            document.addEventListener('keydown', handleEscapeKey);

        } else {
            isCapturing = false;
            button.innerHTML = `📖 View Bible (${capturedElements.length})`;
            button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';

            // Remove event listeners
            document.removeEventListener('click', handleElementClick, true);
            document.removeEventListener('mouseover', handleMouseOver, true);
            document.removeEventListener('mouseout', handleMouseOut, true);
            document.removeEventListener('keydown', handleEscapeKey);

            // Hide overlay and tooltip
            overlay.style.display = 'none';
            const tooltip = document.getElementById('hover-tooltip');
            if (tooltip) tooltip.style.display = 'none';

            // Disconnect observers
            if (mutationObserver) mutationObserver.disconnect();
            if (intersectionObserver) intersectionObserver.disconnect();
            if (resizeObserver) resizeObserver.disconnect();
            if (performanceObserver) performanceObserver.disconnect();
        }
    }

    function handleEscapeKey(event) {
        if (event.key === 'Escape' && isCapturing) {
            toggleCapturing();
        }
    }

    // Update the info panel content
    function updateInfoPanel() {
        const content = document.getElementById('panel-content');
        if (!content) return;

        // Update header count
        const header = infoPanel.querySelector('div');
        header.querySelector('span').textContent = `📖 Captured Elements (${capturedElements.length})`;

        content.innerHTML = capturedElements.map((info, index) => `
            <div style="border: 1px solid rgba(255,255,255,0.3); margin: 8px 0; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.1); backdrop-filter: blur(5px);">
                <div style="font-weight: bold; margin-bottom: 8px; color: #fff;">
                    ${index + 1}. ${info.basic.tagName.toUpperCase()}${info.basic.id ? ` #${info.basic.id}` : ''}
                    ${info.accessibility.roleInfo.computedRole ? ` [${info.accessibility.roleInfo.computedRole}]` : ''}
                </div>
                <div style="font-size: 11px; color: #e0e0e0; margin-bottom: 8px; max-height: 40px; overflow: hidden;">
                    ${info.accessibility.labelInfo.computedName || info.basic.textContent.substring(0, 80) || 'No accessible name'}
                </div>
                <div style="font-size: 10px; color: #ccc; margin-bottom: 8px;">
                    📍 ${Math.round(info.geometry.boundingClientRect.x)}, ${Math.round(info.geometry.boundingClientRect.y)}
                    📏 ${Math.round(info.geometry.boundingClientRect.width)}×${Math.round(info.geometry.boundingClientRect.height)}
                    ${info.accessibility.focusInfo.isFocusable ? ' 🎯' : ''}
                    ${info.interaction.clickable ? ' 👆' : ''}
                </div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button onclick="copyElementBible(${index})" style="background: #2196F3; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        📋 Copy Bible
                    </button>
                    <button onclick="copyElementSelectors(${index})" style="background: #9C27B0; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        🎯 Selectors
                    </button>
                    <button onclick="copyAccessibilityInfo(${index})" style="background: #FF9800; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        ♿ A11y
                    </button>
                    <button onclick="showElementBible(${index})" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        📖 View
                    </button>
                    <button onclick="highlightElement(${index})" style="background: #795548; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        ✨ Highlight
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Export functions for buttons - FIXED VERSION
    window.copyElementBible = function(index) {
        try {
            console.log('Copying element at index:', index);
            console.log('Total captured elements:', capturedElements.length);

            if (index >= capturedElements.length || index < 0) {
                showNotification('❌ Invalid element index');
                return;
            }

            const info = capturedElements[index];
            if (!info) {
                showNotification('❌ No element data found');
                return;
            }

            // Create a clean copy without circular references
            const cleanInfo = JSON.parse(JSON.stringify(info, (key, value) => {
                // Skip problematic properties
                if (key === 'element' ||
                    key === 'parentNode' ||
                    key === 'childNodes' ||
                    value === window ||
                    value === document ||
                    (typeof value === 'object' && value !== null && value.nodeType)) {
                    return undefined;
                }
                return value;
            }));

            const jsonString = JSON.stringify(cleanInfo, null, 2);

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(jsonString).then(() => {
                    showNotification('📖 Element bible copied to clipboard!');
                }).catch(err => {
                    console.error('Clipboard API failed:', err);
                    fallbackCopy(jsonString);
                });
            } else {
                fallbackCopy(jsonString);
            }

        } catch (error) {
            console.error('Copy Bible Error:', error);
            showNotification('❌ Copy failed: ' + error.message);
        }
    };

    // Fallback copy method
    function fallbackCopy(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999);

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showNotification('📖 Element bible copied (fallback method)!');
            } else {
                showNotification('❌ Copy failed - please try manual selection');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showNotification('❌ All copy methods failed');
        }
    }

    window.copyElementSelectors = function(index) {
        const info = capturedElements[index];
        const selectors = {
            xpath: info.selectors.xpath,
            cssSelector: info.selectors.cssSelector,
            id: info.selectors.id,
            className: info.selectors.className,
            nthChild: info.selectors.nthChild,
            dataAttributes: info.selectors.dataAttributes
        };
        navigator.clipboard.writeText(JSON.stringify(selectors, null, 2)).then(() => {
            showNotification('🎯 Element selectors copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy selectors:', err);
            showNotification('❌ Failed to copy selectors');
        });
    };

    window.copyAccessibilityInfo = function(index) {
        const info = capturedElements[index];
        const a11yInfo = {
            accessibility: info.accessibility,
            browserAccessibility: info.browserAccessibility,
            formInfo: info.formInfo,
            mediaInfo: info.mediaInfo
        };
        navigator.clipboard.writeText(JSON.stringify(a11yInfo, null, 2)).then(() => {
            showNotification('♿ Accessibility information copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy accessibility info:', err);
            showNotification('❌ Failed to copy accessibility info');
        });
    };

    window.showElementBible = function(index) {
        const info = capturedElements[index];
        const bibleWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes');
        bibleWindow.document.write(`
            <html>
                <head>
                    <title>Element Bible - ${info.basic.tagName.toUpperCase()}</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', sans-serif;
                            padding: 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            margin: 0;
                            min-height: 100vh;
                        }
                        .section {
                            background: rgba(255,255,255,0.1);
                            margin: 15px 0;
                            padding: 15px;
                            border-radius: 10px;
                            backdrop-filter: blur(10px);
                        }
                        .section h3 {
                            margin-top: 0;
                            color: #ffd700;
                        }
                        pre {
                            background: rgba(0,0,0,0.3);
                            padding: 10px;
                            border-radius: 5px;
                            overflow-x: auto;
                            font-size: 12px;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                        .highlight {
                            background: #ffd700;
                            color: #000;
                            padding: 2px 4px;
                            border-radius: 3px;
                        }
                        button {
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 10px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin: 5px;
                        }
                        button:hover {
                            background: #45a049;
                        }
                    </style>
                </head>
                <body>
                    <h1>📖 Element Bible</h1>
                    <div class="highlight">
                        ${info.basic.tagName.toUpperCase()}${info.basic.id ? '#' + info.basic.id : ''}
                        - Role: ${info.accessibility.roleInfo.computedRole}
                        - Accessible Name: "${info.accessibility.labelInfo.computedName}"
                    </div>

                    <div class="section">
                        <h3>🎯 Quick Actions</h3>
                        <button onclick="copyFullData()">📋 Copy All Data</button>
                        <button onclick="navigator.clipboard.writeText('${info.selectors.xpath.replace(/'/g, "\\'")}')">📍 Copy XPath</button>
                        <button onclick="navigator.clipboard.writeText('${info.selectors.cssSelector.replace(/'/g, "\\'")}')">🎨 Copy CSS Selector</button>
                        <button onclick="window.print()">🖨️ Print Bible</button>
                    </div>

                    <div id="bible-content">
                        <div class="section">
                            <h3>📊 Basic Information</h3>
                            <pre>${JSON.stringify(info.basic, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>♿ Accessibility Information</h3>
                            <pre>${JSON.stringify(info.accessibility, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>📐 Geometry & Position</h3>
                            <pre>${JSON.stringify(info.geometry, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>🎨 Comprehensive Styles</h3>
                            <pre>${JSON.stringify(info.styles, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>🎯 All Selectors</h3>
                            <pre>${JSON.stringify(info.selectors, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>🔧 Attributes</h3>
                            <pre>${JSON.stringify(info.attributes, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>👆 Interaction Properties</h3>
                            <pre>${JSON.stringify(info.interaction, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>🌳 Context & Relationships</h3>
                            <pre>${JSON.stringify(info.context, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>📱 Media Information</h3>
                            <pre>${JSON.stringify(info.mediaInfo, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>📝 Form Information</h3>
                            <pre>${JSON.stringify(info.formInfo, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>⚡ Performance Metrics</h3>
                            <pre>${JSON.stringify(info.performance, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>🔄 Dynamic Data</h3>
                            <pre>${JSON.stringify(info.dynamicData, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>

                        <div class="section">
                            <h3>🌐 Browser & Metadata</h3>
                            <pre>${JSON.stringify(info.browserAccessibility, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                            <pre>${JSON.stringify(info.metadata, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>
                    </div>

                    <script>
                        function copyFullData() {
                            const content = document.getElementById('bible-content').textContent;
                            if (navigator.clipboard) {
                                navigator.clipboard.writeText(content).then(() => {
                                    alert('✅ All data copied to clipboard!');
                                }).catch(() => {
                                    selectAllText();
                                });
                            } else {
                                selectAllText();
                            }
                        }

                        function selectAllText() {
                            const range = document.createRange();
                            range.selectNode(document.getElementById('bible-content'));
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                            alert('📋 Text selected - press Ctrl+C to copy');
                        }
                    </script>
                </body>
            </html>
        `);
    };

    window.highlightElement = function(index) {
        const info = capturedElements[index];
        const element = info.element;
        if (!element || !element.isConnected) {
            showNotification('❌ Element no longer exists in DOM');
            return;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const originalStyles = {
            background: element.style.backgroundColor,
            border: element.style.border,
            boxShadow: element.style.boxShadow
        };

        element.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        element.style.border = '5px solid red';
        element.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.8)';

        setTimeout(() => {
            element.style.backgroundColor = originalStyles.background;
            element.style.border = originalStyles.border;
            element.style.boxShadow = originalStyles.boxShadow;
        }, 2000);

        showNotification('✨ Element highlighted!');
    };

    function exportAllData() {
        const exportData = {
            meta: {
                exportTime: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                totalElements: capturedElements.length,
                version: '2.0'
            },
            elements: capturedElements.map(el => {
                const copy = JSON.parse(JSON.stringify(el));
                delete copy.element; // Remove element reference for export
                return copy;
            })
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `element-bible-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('📁 Complete element bible exported!');
    }

    function clearCapturedData() {
        capturedElements = [];
        elementMutations.clear();
        elementVisibility.clear();
        updateInfoPanel();
        document.getElementById('element-inspector-toggle').innerHTML = '📖 Start Bible Capture';
        showNotification('🗑️ All captured data cleared!');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10002;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Initialize the ultimate script
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        createToggleButton();
        overlay = createOverlay();

        console.log('🔥 ULTIMATE Element Inspector - Bible Edition Loaded! 🔥');
        console.log('📖 This script captures EVERYTHING about elements for screen reader development');
        console.log('🎯 Features: MutationObserver, IntersectionObserver, ResizeObserver, Performance metrics, Complete accessibility tree, Browser APIs, and MORE!');

        showNotification('📖 Ultimate Element Inspector loaded! Click the button to start capturing.');
    }

    init();
})();
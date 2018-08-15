/**
 * @file aria-accordion.js
 * @author Frédéric BISSON <zigazou@free.fr>
 * @version 1.0
 *
 * Accessible Accordion system, using ARIA. Based on the jQuery Accessible tab
 * panel system, using ARIA, plugin by Nicolas Hoffmann.
 * 
 * https://github.com/nico3333fr/jquery-accessible-accordion-aria/
 */

/**
 * The AriaAccordionOptions holds all the options used by the AriaAccordion
 * class.
 *
 * @typedef {Object} AriaAccordionOptions
 * @property {string} headersSelector CSS selector used to identify headers.
 * @property {string} panelsSelector CSS selector used to identify panels.
 * @property {string} buttonsSelector CSS selector used to identify buttons.
 * @property {string} buttonsGeneratedContent "text" copies content as text,
 *                                            "html" copies content as HTML
 * @property {HTMLButtonElement} button The button that will be cloned to open
 *                                      or close a panel.
 * @property {string} buttonSuffixId Suffix of button ID.
 * @property {boolean} multiselectable Indicates if the accordion is
 *                                     multiselectable
 * @property {string} prefixClass Prefix of CSS accordion class.
 * @property {string} headerSuffixClass Suffix of CSS header class.
 * @property {string} buttonSuffixClass Suffix of CSS button class.
 * @property {string} direction "ltr" for left to right,
 *                              "rtl" for right to left.
 * @property {string} accordionPrefixId Accordion prefix ID.
 */

/**
 * Accessible Accordion system, using ARIA
 * Based on: https://a11y.nicolas-hoffmann.net/accordion/
 */
class AriaAccordion {
    /**
     * Create an AriaAccordion.
     * @param {HTMLElement} container The container element.
     * @param {AriaAccordionOptions?} options The options.
     */
    constructor(container, options) {
        /**
         * An attribute containing every option.
         * @member {Object}
         * @private
         */
        this.options = Object.assign(
            {},
            AriaAccordion.defaultConfig,
            options || {}
        )

        /**
         * The HTMLElement containing all the elements of the accordion.
         * @member {HTMLElement}
         * @private
         */
        this.root = container

        /**
         * The panels of our accordion.
         * @member {HTMLElement[]}
         * @private
         */
        this.panels = Array.from(
            this.root.querySelectorAll(this.options.panelsSelector)
        )

        this.initAttributes()
        this.initEvents()

        /**
         * The buttons that will open or close the panels.
         * @member {HTMLElement[]}
         * @private
         */
        this.buttons = Array.from(
            this.root.querySelectorAll(this.options.buttonsSelector)
        )
    }

    /**
     * Initializes attributes and classes of the accordion elements.
     */
    initAttributes() {
        this.root.setAttribute('role', 'tablist')
        this.root.setAttribute(
            'aria-multiselectable',
            this.options.multiselectable.toString()
        )
        this.root.classList.add(this.options.prefixClass)

        // id generated if not present
        if(!this.root.hasAttribute('id')) {
            const readableIndex = Math.random().toString(32).slice(2, 12)
            this.root.setAttribute(
                'id',
                this.options.accordionPrefixId + '-' + readableIndex
            )
        }

        this.panels.forEach((panel, index) => {
            const header = panel.querySelector(this.options.headersSelector)

            const button = this.options.button.cloneNode()
            button.innerHTML = this.options.buttonsGeneratedContent === 'html'
                             ? header.innerHTML
                             : header.innerText

            header.setAttribute('tabindex', '0')
            header.classList.add(
                this.options.prefixClass + this.options.headerSuffixClass
            )

            this.root.insertBefore(button, panel)

            const panelId = (panel.id || this.root.id) + '-' + index

            const buttonId = panelId + this.options.buttonSuffixId

            button.setAttribute('aria-controls', panelId)
            button.setAttribute('aria-expanded', 'false')
            button.setAttribute('role', 'tab')
            button.setAttribute('id', buttonId)
            button.setAttribute('tabIndex', '-1')
            button.setAttribute('aria-selected', 'false')
            button.classList.add(
                this.options.prefixClass + this.options.buttonSuffixClass
            )

            panel.setAttribute('aria-labelledby', buttonId)
            panel.setAttribute('role', 'tabpanel')
            panel.setAttribute('id', panelId)
            panel.setAttribute('aria-hidden', 'true')
            panel.classList.add(
                this.options.prefixClass + this.options.panelSuffixClass
            )

            // if opened by default
            if(panel.dataset.accordionOpen === 'true') {
                button.setAttribute('aria-expanded', 'true')
                button.dataset.accordionOpen = null
                panel.setAttribute('aria-hidden', 'false')
            }

            // init first one focusable
            if(index === 0) button.removeAttribute('tabindex');
        })
    }

    /**
     * Install events on the accordion elements.
     */
    initEvents() {
        this.root.querySelectorAll(this.options.buttonsSelector).forEach(
            button => {
                button.addEventListener(
                    'focus',
                    event => this.focusButtonEventHandler(event)
                )

                button.addEventListener(
                    'click',
                    event => this.clickButtonEventHandler(event)
                )

                button.addEventListener(
                    'keydown',
                    event => this.keydownButtonEventHandler(event)
                )
            }
        )

        this.root.querySelectorAll(this.options.panelsSelector).forEach(
            panel => {
                panel.addEventListener(
                    'keydown',
                    event => this.keydownPanelEventHandler(event)
                )
            }
        )
    }

    /**
     * Handles button focus event.
     *
     * @param {Event} event The event information.
     * @private
     */
    focusButtonEventHandler(event) {
        const target = event.target
        const currentButton = AriaAccordion.closest(target, 'button')

        this.root.querySelectorAll(this.options.buttonsSelector).forEach(
            button => {
                button.setAttribute('tabindex', '-1')
                button.setAttribute('aria-selected', 'false')
            }
        )

        currentButton.setAttribute('aria-selected', 'true')
        currentButton.setAttribute('tabindex', null)
    }

    /**
     * Handles button click event.
     *
     * @param {Event} event The event information.
     * @private
     */
    clickButtonEventHandler(event) {
        const currentButton = AriaAccordion.closest(event.target, 'button')
        const currentPanel = document.getElementById(
            currentButton.getAttribute('aria-controls')
        )

        this.buttons.forEach(
            button => button.setAttribute('aria-selected', 'false')
        )

        currentButton.setAttribute('aria-selected', 'true')

        // opened or closed?
        if(currentButton.getAttribute('aria-expanded') === 'false') {
            // closed
            currentButton.setAttribute('aria-expanded', 'true')
            currentPanel.setAttribute('aria-hidden', 'false')
        } else {
            // opened
            currentButton.setAttribute('aria-expanded', 'false')
            currentPanel.setAttribute('aria-hidden', 'true')
        }

        if(this.options.multiselectable === false) {
            this.panels.forEach(panel => {
                if(currentPanel !== panel) {
                    panel.setAttribute('aria-hidden', 'true')
                }
            })

            this.buttons.forEach(button => {
                if(currentButton !== button) {
                    button.setAttribute('aria-expanded', 'false')
                }
            })
        }

        setTimeout(() => currentButton.focus(), 0)

        event.stopPropagation()
        event.preventDefault()
    }

    /**
     * Handles keydown event on a button.
     *
     * @param {Event} event The event information.
     * @private
     */
    keydownButtonEventHandler(event) {
        const currentButton = AriaAccordion.closest(event.target, 'button')
        const firstButton = this.buttons[0]
        const lastButton = this.buttons[this.buttons.length - 1]
        const index = this.buttons.indexOf(currentButton)

        let newTarget = null

        const keys = this.options.direction === 'ltr'
                   ? AriaAccordion.ltrKeys
                   : AriaAccordion.rtlKeys

        const allKeyCode = [].concat(
            keys.prev, keys.next, keys.first, keys.last
        )

        if(allKeyCode.includes(event.keyCode) && !event.ctrlKey) {
            this.buttons.forEach(button => {
                button.setAttribute('tabindex', '-1')
                button.setAttribute('aria-selected', 'false')
            })

            if(event.keyCode === AriaAccordion.keyHome) {
                newTarget = firstButton
            } else if(event.keyCode === AriaAccordion.keyEnd) {
                // strike end in the tab => last tab
                newTarget = lastButton
            } else if(keys.prev.includes(event.keyCode)) {
                // strike up or left in the tab => previous tab
                // if we are on first one, activate last
                newTarget = currentButton === firstButton
                          ? lastButton
                          : this.buttons[index - 1]
            } else if(keys.next.includes(event.keyCode)) {
                // strike down or right in the tab => next tab
                // if we are on last one, activate first
                newTarget = currentButton === lastButton
                          ? firstButton
                          : this.buttons[index + 1]
            }

            if(newTarget !== null) AriaAccordion.goToHeader(newTarget)

            event.preventDefault()
        }
    }

    /**
     * Handles keydown button event on a panel.
     *
     * @param {Event} event The event information.
     * @private
     */
    keydownPanelEventHandler(event) {
        const panel = event.target.querySelector(this.options.panelsSelector)
        const button = this.root.getElementById(
            panel.getAttribute('aria-labelledby')
        )
        const firstButton = this.buttons[0]
        const lastButton = this.buttons[this.buttons.length - 1]
        const index = this.buttons.indexOf(button)

        if(event.ctrlKey) {
            let target = null

            if(event.keyCode === AriaAccordion.keyUp) {
                // CTRL+UP => go to header
                target = button
            } else if(event.keyCode === AriaAccordion.keyPageUp) {
                // CTRL+PAGE-UP => go to previous header
                target = button === firstButton ? lastButton
                                                : this.buttons[index - 1]
            } else if(event.keyCode === AriaAccordion.keyPageDown) {
                // CTRL+PAGE-DOWN => go to next header
                target = button === lastButton ? firstButton
                                               : this.buttons[index + 1]
            }

            if(target !== null) {
                AriaAccordion.goToHeader(target)
                event.preventDefault()
            }
        }

    }
}

/**
 * Focus on a specific element.
 *
 * @param {HTMLElement} target Element that will receive focus.
 */
AriaAccordion.goToHeader = function(target) {
    target.setAttribute('aria-selected', 'true')
    target.setAttribute('tabindex', null)

    setTimeout(() => target.focus(), 0)
}

/**
 * Imitates the "closest" jQuery method which will go through the ancestors of
 * an element to find the one matching a selector.
 *
 * @param {HTMLElement} element Search starts from this element.
 * @param {string} selector CSS selector to match.
 * @return {HTMLelement} The element found or null.
 */
AriaAccordion.closest = function(element, selector) {
    if(element === null) return null
    if(element.matches(selector)) return element
    if(element instanceof HTMLHtmlElement) return null

    return AriaAccordion.closest(element.parentNode, selector)
}

/**
 * Key code for the Page Up key.
 *
 * @member {int}
 */
AriaAccordion.keyPageUp = 33

/**
 * Key code for the Page Down key.
 *
 * @member {int}
 */
AriaAccordion.keyPageDown = 34

/**
 * Key code for the End key.
 *
 * @member {int}
 */
AriaAccordion.keyEnd = 35

/**
 * Key code for the Home key.
 *
 * @member {int}
 */
AriaAccordion.keyHome = 36

/**
 * Key code for the Cursor Left key.
 *
 * @member {int}
 */
AriaAccordion.keyLeft = 37

/**
 * Key code for the Cursor Up key.
 *
 * @member {int}
 */
AriaAccordion.keyUp = 38

/**
 * Key code for the Cursor Right key.
 *
 * @member {int}
 */
AriaAccordion.keyRight = 39

/**
 * Key code for the Cursor Down key.
 *
 * @member {int}
 */
AriaAccordion.keyDown = 40

/**
 * Key codes for left to right display.
 *
 * @member {Object}
 */
AriaAccordion.ltrKeys = {
    prev: [AriaAccordion.keyUp, AriaAccordion.keyLeft],
    next: [AriaAccordion.keyDown, AriaAccordion.keyRight],
    first: AriaAccordion.keyHome,
    last: AriaAccordion.keyEnd
}

/**
 * Key codes for right to left display.
 *
 * @member {Object}
 */
AriaAccordion.rtlKeys = {
    prev: [AriaAccordion.keyUp, AriaAccordion.keyRight],
    next: [AriaAccordion.keyDown, AriaAccordion.keyLeft],
    first: AriaAccordion.keyHome,
    last: AriaAccordion.keyEnd
}

/**
 * Generates a default button.
 *
 * @member {HTMLButtonElement}
 */
AriaAccordion.defaultButton = function() {
    const button = document.createElement('button')
    button.classList.add('js-accordion__header')
    button.setAttribute('type', 'button')

    return button
}

/**
 * Default configuration options.
 *
 * @member {AriaAccordionOptions}
 */
AriaAccordion.defaultConfig = {
    headersSelector: '.js-accordion__header',
    panelsSelector: '.js-accordion__panel',
    buttonsSelector: 'button.js-accordion__header',
    buttonsGeneratedContent: 'text',
    button: AriaAccordion.defaultButton(),
    buttonSuffixId: '_tab',
    multiselectable: true,
    prefixClass: 'accordion',
    headerSuffixClass: '__title',
    buttonSuffixClass: '__header',
    panelSuffixClass: '__panel',
    direction: 'ltr',
    accordionPrefixId: 'accordion'
}

/**
 * Initializes all the accordion container given their selector.
 *
 * Each container may have the following data attributes:
 *
 * - data-accordion-multiselectable: "true" or "false"
 * - data-accordion-prefix-class: prefix classes
 * - data-accordion-button-generated-content: "text" or "html"
 *
 * @param {string} selector a CSS selector to specify every accordion container.
 * @param {AriaAccordionOptions} options Object containing all the custom
 *                                       settings.
 * @return {AriaAccordion[]} An array of AriaAccordion.
 */
AriaAccordion.init = function(selector, options) {
    const containers = Array.from(document.querySelectorAll(selector))

    return containers.map(container => {
        // Look for options given via data attributes.
        const tagOptions = {}

        // data-accordiion-multiselectable
        if(container.dataset.accordionMultiselectable === 'false') {
            tagOptions.multiselectable = false
        }

        // data-accordion-prefix-class
        if(container.dataset.accordionPrefixClass !== undefined) {
            tagOptions.prefixClass = container.dataset.accordionPrefixClass
        }

        // data-accordion-button-generated-content
        if(container.dataset.accordionButtonGeneratedContent !== undefined) {
            tagOptions.buttonsGeneratedContent =
                container.dataset.accordionButtonGeneratedContent
        }

        // Try to guess the direction used in the container.
        if(AriaAccordion.closest(container, '[dir="rtl"]') !== null) {
            tagOptions.direction = 'rtl'
        }

        return new AriaAccordion(
            container,
            Object.assign({}, tagOptions, options)
        )
    })
}

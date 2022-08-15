// Need to remove JQuery and use this instead in exporters
class JSQuery {
    constructor(selector) {
        if (selector) {
            if (typeof selector === 'string') {
                this.elements = document.querySelectorAll(selector);
                this.element = this.elements[0];
            } else if (selector instanceof NodeList) {
                this.elements = selector;
                this.element = selector[0];
            } else if (selector instanceof HTMLElement) {
                this.element = selector;
                this.elements = [selector];
            } else {
                this.element = selector;
                this.elements = [selector];
            }

            this.length = this.elements.length;
        } else {
            this.elements = [];
            this.length = 0;
        }
    }

    attr(name, value) {
        if (typeof value === 'string') {
            if (!this.element) { return this; }
            this.element.setAttribute(name, value);
            return this;
        } else {
            if (!this.element) { return null; }
            return this.element?.attributes?.getNamedItem(name)?.value;
        }
    }

    find(selector) {
        if (!this.element) { return null; }
        selector = selector.split(',').map(s => {
            if (s.trim().startsWith('>')) {
                s = `:scope ${s}`;
            }

            return s;
        }).join();
        // :visible need to be handled with (element.offsetWidth > 0 || element.offsetHeight > 0)
        return new JSQuery(this.element.querySelectorAll(selector));
    }

    text() { return this.element?.innerText || ''; }
    html(str) {
        if (typeof str === 'string' && this.element) {
            this.element.innerHTML = str;
        } else {
            return this.element?.innerText || '';
        }
    }
    width() { return this.element?.clientWidth; }
    get(index) { return this.elements[index]; }
    each(func) { this.elements.forEach((el, i) => func(i, el)); }
    is(selector) { return this.element.matches(selector); }
    append(child) {
        if (typeof (child) === 'string') {
            const div = document.createElement('div');
            div.innerHTML = child;
            child = div.childNodes[0];
        } else if (child instanceof JSQuery) {
            child = child.get(0);
        }
        this.element.appendChild(child);
        return new JSQuery(child);
    }
    click(func) {
        if (this.element) {
            this.element.addEventListener('click', func);
        }
        return this;
    }
    closest(selector) {
        return new JSQuery(this.element.closest(selector));
    }
    remove() {
        this.elements.forEach((el, i) => el.remove());
    }
    parent() {
        return new JSQuery(this.element?.parentNode);
    }
}

const $ = function (selector) { return new JSQuery(selector); };

export default $;
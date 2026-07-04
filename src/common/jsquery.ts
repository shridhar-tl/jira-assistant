class JSQuery {
    elements: Element[];
    element: Element | null;
    length: number;

    constructor(selector?: string | NodeList | HTMLElement | Element | null) {
        if (selector) {
            if (typeof selector === 'string') {
                this.elements = Array.from(document.querySelectorAll(selector)) as Element[];
                this.element = this.elements[0] || null;
            } else if (selector instanceof NodeList) {
                this.elements = Array.from(selector) as Element[];
                this.element = this.elements[0] || null;
            } else if (selector instanceof HTMLElement || selector instanceof Element) {
                this.element = selector;
                this.elements = [selector];
            } else {
                this.element = selector;
                this.elements = [selector];
            }

            this.length = this.elements.length;
        } else {
            this.elements = [];
            this.element = null;
            this.length = 0;
        }
    }

    attr(name: string, value?: string): string | null | this {
        if (typeof value === 'string') {
            if (!this.element) {
                return this;
            }
            this.element.setAttribute(name, value);
            return this;
        } else {
            if (!this.element) {
                return null;
            }
            return this.element?.attributes?.getNamedItem(name)?.value || null;
        }
    }

    find(selector: string): JSQuery {
        if (!this.element) {
            return new JSQuery(null);
        }
        selector = selector
            .split(',')
            .map((s) => {
                if (s.trim().startsWith('>')) {
                    s = `:scope ${s}`;
                }
                return s;
            })
            .join(',');
        return new JSQuery(this.element.querySelectorAll(selector));
    }

    text(): string {
        return (this.element as HTMLElement)?.innerText || '';
    }

    html(str?: string): string | void {
        if (typeof str === 'string' && this.element) {
            (this.element as HTMLElement).innerHTML = str;
        } else {
            return (this.element as HTMLElement)?.innerText || '';
        }
    }

    width(): number | undefined {
        return (this.element as HTMLElement)?.clientWidth;
    }

    get(index: number): Element {
        return this.elements[index];
    }

    each(func: (index: number, element: Element) => void): void {
        this.elements.forEach((el, i) => func(i, el));
    }

    is(selector: string): boolean {
        return this.element?.matches(selector) || false;
    }

    append(child: string | JSQuery | Element | HTMLElement): JSQuery {
        let childElement: Element | HTMLElement;

        if (typeof child === 'string') {
            const div = document.createElement('div');
            div.innerHTML = child;
            childElement = div.childNodes[0] as Element;
        } else if (child instanceof JSQuery) {
            childElement = child.get(0);
        } else {
            childElement = child;
        }

        (this.element as HTMLElement).appendChild(childElement);
        return new JSQuery(childElement);
    }

    click(func: (event: Event) => void): this {
        if (this.element) {
            this.element.addEventListener('click', func);
        }
        return this;
    }

    closest(selector: string): JSQuery {
        return new JSQuery((this.element as HTMLElement)?.closest(selector) || null);
    }

    remove(): void {
        this.elements.forEach((el) => el.remove());
    }

    parent(): JSQuery {
        return new JSQuery(((this.element as HTMLElement)?.parentNode as Element) || null);
    }
}

const $ = function (selector?: string | NodeList | HTMLElement | Element | null): JSQuery {
    return new JSQuery(selector);
};

export default $;

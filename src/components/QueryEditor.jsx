import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import parser from 'js-sql-parser';
import useDebounce from 'react-controls/hooks/useDebounce';
import './QueryEditor.scss';

const KEYWORDS = [
    'select',
    'from',
    'where',
    'join',
    'left join',
    'right join',
    'inner join',
    'group by',
    'order by',
    'having',
    'limit',
    'top',
    'distinct',
    'as',
    'on',
    'values',
    'set',
    'and',
    'or',
];

function QueryEditor({ value, onChange, getSuggestions }) {
    const [suggestions, setSuggestions] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFocused, setFocus] = useState(false);
    const [showSug, setShowSug] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const textareaRef = useRef(null);
    const suggestionRef = useRef(null);

    const getCaretCoordinates = () => {
        const textarea = textareaRef.current;
        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);
        for (const prop of style) {
            div.style[prop] = style[prop];
        }
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.textContent = textarea.value.substring(0, textarea.selectionStart);
        const span = document.createElement('span');
        span.textContent = textarea.value.substring(textarea.selectionStart) || '.';
        div.appendChild(span);
        document.body.appendChild(div);
        const { offsetLeft, offsetTop } = span;
        document.body.removeChild(div);
        return {
            top: offsetTop + 50 - (textarea.scrollTop || 0),
            left: (offsetLeft - textarea.scrollLeft) - 50
        };
    };

    const validateAndTriggerChange = useDebounce((sql) => {
        const { json, error } = validateQuery(sql);
        setErrorMessage(error);
        onChange(sql, !error && json);
    });

    const handleChange = (e) => {
        const sql = e.target.value;
        validateAndTriggerChange(sql);
        onChange(sql, false);
        setTimeout(() => {
            const coords = getCaretCoordinates();
            setPosition(coords);
        }, 0);
        handleSuggestions(sql, e.target.selectionStart);
    };

    const handleSuggestions = (text, caretPos) => {
        const prefixInfo = getPrefix(text, caretPos);
        if (!prefixInfo) {
            setShowSug(false);
            return;
        }
        const { prefix, isTable, immediatelyAfterKeyword } = prefixInfo;
        let sugg = [];

        // Determine if the cursor is at the start of the query
        const beforePrefix = text.substring(0, caretPos - prefix.length);
        const isAtStart = /^\s*$/.test(beforePrefix);

        if (isAtStart) {
            sugg = [{ value: 'select', label: 'select', type: 'keyword' }];
        } else {
            if (!immediatelyAfterKeyword && prefix.length > 0) {
                sugg = KEYWORDS.filter(kw => kw.startsWith(prefix.toLowerCase())).map((kw) => ({ value: kw, label: kw, type: 'keyword' }));
            }

            sugg = sugg.concat(getSuggestions(prefix, isTable));
        }

        setSuggestions(sugg);
        setSuggestionIndex(0);
        setShowSug(sugg.length > 0);
    };

    const getPrefix = (text, pos) => {
        const before = text.substring(0, pos);
        let isTable = false;

        // Check if the cursor is right after a keyword that expects a table name
        if (/\b(select|insert|update|delete)\s+$/i.test(before)) {
            return { prefix: '', isTable: false, immediatelyAfterKeyword: true };
        }

        const tableKeywords = ['from', 'join', 'left join', 'right join', 'inner join'];
        const keywordMatch = before.match(new RegExp(`\\b(${tableKeywords.join('|')})\\s+(\\w*)$`, 'i'));

        if (keywordMatch) {
            isTable = true;
            return { prefix: keywordMatch[2], isTable, immediatelyAfterKeyword: true };
        }

        const aliasMatch = before.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/);
        if (aliasMatch) {
            const prefix = aliasMatch[2];
            return { prefix, isTable: false, immediatelyAfterKeyword: false };
        }

        const wordMatch = before.match(/(?:[\s,()]+)(\w*)$/);
        if (wordMatch) {
            const prefix = wordMatch[1];
            const isAfterKeyword = before.match(new RegExp(`\\b(${KEYWORDS.join('|')})\\s+$`, 'i'));
            if (isAfterKeyword) {
                return { prefix, isTable: false, immediatelyAfterKeyword: true };
            }
            return { prefix, isTable: false, immediatelyAfterKeyword: false };
        }

        // Handle the case when the entire text might be a prefix (e.g., at the very start)
        const startMatch = before.match(/^(\w*)$/);
        if (startMatch) {
            return { prefix: startMatch[1], isTable: false, immediatelyAfterKeyword: false };
        }

        return null;
    };

    const handleKeyDown = (e) => {
        if (showSug) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex((prev) => ((prev < suggestions.length - 1) ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectSuggestion(suggestionIndex);
            } else if (e.key === 'Escape') {
                setShowSug(false);
            }
        }
    };

    const selectSuggestion = (index) => {
        const sugg = suggestions[index];
        const textarea = textareaRef.current;
        const pos = textarea.selectionStart;
        const text = textarea.value;
        const before = text.substring(0, pos);
        const after = text.substring(pos);
        const prefixInfo = getPrefix(text, pos);
        if (!prefixInfo) { return; }
        let newText = '';
        if (prefixInfo.isTable || sugg.type === 'keyword') {
            newText = `${before.substring(0, before.length - prefixInfo.prefix.length)}${sugg.value} ${after}`;
        } else {
            const lastWordMatch = before.match(/(\b\w+(\.\w+)?)$/);
            if (lastWordMatch) {
                const start = pos - lastWordMatch[1].length;
                newText = `${before.substring(0, start)}${sugg.value} ${after}`;
            } else {
                newText = `${before}${sugg.value} ${after}`;
            }
        }
        onChange(newText);
        setShowSug(false);
        setSuggestions([]);
        setSuggestionIndex(0);
        setTimeout(() => {
            textarea.focus();
            const newPos = `${before.substring(0, before.length - prefixInfo.prefix.length)}${sugg.value} `.length;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleSuggestionClick = (index) => {
        selectSuggestion(index);
    };

    useEffect(() => {
        if (showSug) {
            const coords = getCaretCoordinates();
            setPosition(coords);
        }
    }, [showSug]);

    return (
        <div className="query-editor">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={classNames("editor-textarea", isFocused ? 'expanded' : 'collapsed', errorMessage && 'error')}
                onFocus={() => setFocus(true)}
                onBlur={() => { setFocus(false); setShowSug(false); }}
                placeholder={`Write your SQL query here...\n(example: select assignee, key, issuetype where reporter=currentUser())`}
            />
            {!!errorMessage && <span className="msg-error">{errorMessage}</span>}
            {showSug && (
                <ul
                    className="suggestions"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                    ref={suggestionRef}
                >
                    {suggestions.map((sugg, idx) => (
                        <li
                            key={idx}
                            className={idx === suggestionIndex ? 'active' : ''}
                            onMouseDown={() => handleSuggestionClick(idx)}
                        >
                            {sugg.type !== 'keyword' && <span className={`icon ${sugg.type}`}></span>}
                            {sugg.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default QueryEditor;

function validateQuery(sql) {
    if (!sql?.trim()) {
        return { error: '' };
    }

    if (sql?.trim()?.length < 22) {
        return { error: 'Query is incomplete' };
    }

    try {
        const { value: json } = parser.parse(sql);

        if (json.type?.toLowerCase() !== 'select') {
            return { error: 'Only select queries are supported' };
        }

        const { type, selectItems, from, where, groupBy, having, orderBy, limit } = json;

        return { json: { type, selectItems, from, where, groupBy, having, orderBy, limit } };
    } catch (err) {
        return { error: err.message };
    }
}
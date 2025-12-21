import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as monaco from 'monaco-editor';
import { useAppSelector } from 'asab_webui_components';

import './MarkdownEditor.scss';

// Configure Monaco workers for web workers support
self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		return './editor.worker.js';
	}
};

const MarkdownEditor = forwardRef(function MarkdownEditor({
	value,
	onChange,
	onCursorChange,
	onScroll,
	placeholder = 'Start writing your note...',
	notePath,
	...props
}, ref) {
	const theme = useAppSelector(state => state.theme);

	const containerRef = useRef(null);
	const editorRef = useRef(null);
	const isUpdatingRef = useRef(false);

	// Use refs for callbacks to avoid stale closure issues
	const onChangeRef = useRef(onChange);
	const onCursorChangeRef = useRef(onCursorChange);
	const onScrollRef = useRef(onScroll);

	// Keep refs up to date
	useEffect(() => {
		onChangeRef.current = onChange;
		onCursorChangeRef.current = onCursorChange;
		onScrollRef.current = onScroll;
	});

	// Expose textarea-like interface to parent component
	useImperativeHandle(ref, () => ({
		// Get cursor position (character offset from start)
		get selectionStart() {
			if (!editorRef.current) return 0;
			const position = editorRef.current.getPosition();
			if (!position) return 0;
			const model = editorRef.current.getModel();
			if (!model) return 0;
			return model.getOffsetAt(position);
		},

		// Get current value
		get value() {
			if (!editorRef.current) return '';
			return editorRef.current.getValue();
		},

		// Get scroll height
		get scrollHeight() {
			if (!editorRef.current) return 0;
			return editorRef.current.getScrollHeight();
		},

		// Get scroll top
		get scrollTop() {
			if (!editorRef.current) return 0;
			return editorRef.current.getScrollTop();
		},

		// Set scroll position
		scrollTo(options) {
			if (!editorRef.current) return;
			if (typeof options === 'object' && options.top !== undefined) {
				editorRef.current.setScrollTop(options.top);
			}
		},

		// Focus the editor
		focus() {
			if (editorRef.current) {
				editorRef.current.focus();
			}
		},

		// Get the underlying Monaco editor instance
		getEditor() {
			return editorRef.current;
		}
	}), []);

	// Initialize Monaco editor
	useEffect(() => {
		if (!containerRef.current) return;

		// Create the editor with markdown language
		const editor = monaco.editor.create(containerRef.current, {
			value: value || '',
			language: 'markdown',
			theme: theme === 'dark' ? 'vs-dark' : 'vs',
			automaticLayout: true,
			wordWrap: 'on',
			minimap: { autoHide: true },
			fontSize: '14px',
			lineNumbers: 'on',
			lineHeight: 22,
			padding: { top: 16, bottom: 16 },
			scrollBeyondLastLine: false,
			renderWhitespace: 'selection',
			tabSize: 2,
			insertSpaces: false,
			folding: true,
			foldingStrategy: 'indentation',
			showFoldingControls: 'mouseover',
			bracketPairColorization: { enabled: true },
			guides: {
				indentation: true,
				bracketPairs: true
			},
			smoothScrolling: true,
			cursorBlinking: 'smooth',
			cursorSmoothCaretAnimation: 'on',
			fontLigatures: true,
			overviewRulerLanes: 0,
			hideCursorInOverviewRuler: true,
			scrollbar: {
				vertical: 'auto',
				horizontal: 'auto',
				verticalScrollbarSize: 10,
				horizontalScrollbarSize: 10
			},
			placeholder: placeholder
		});

		editorRef.current = editor;

		// Handle content changes
		const contentChangeDisposable = editor.onDidChangeModelContent(() => {
			if (isUpdatingRef.current) return;
			
			if (onChangeRef.current) {
				onChangeRef.current(editor.getValue(), notePath);
			}
		});

		// Handle cursor position changes
		const cursorChangeDisposable = editor.onDidChangeCursorPosition(() => {
			if (onCursorChangeRef.current) {
				onCursorChangeRef.current();
			}
		});

		// Handle scroll
		const scrollDisposable = editor.onDidScrollChange(() => {
			if (onScrollRef.current) {
				onScrollRef.current();
			}
		});

		// Cleanup
		return () => {
			contentChangeDisposable.dispose();
			cursorChangeDisposable.dispose();
			scrollDisposable.dispose();
			editor.dispose();
			editorRef.current = null;
		};
	}, [notePath]);

	// Update value when prop changes (from external source)
	useEffect(() => {
		if (!editorRef.current) return;
		
		const currentValue = editorRef.current.getValue();
		if (value !== currentValue) {
			isUpdatingRef.current = true;
			
			// Save cursor position
			const position = editorRef.current.getPosition();
			const scrollTop = editorRef.current.getScrollTop();
			
			// Update value
			editorRef.current.setValue(value || '');
			
			// Restore cursor position if possible
			if (position) {
				const model = editorRef.current.getModel();
				if (model) {
					const maxLine = model.getLineCount();
					const safeLineNumber = Math.min(position.lineNumber, maxLine);
					const maxColumn = model.getLineMaxColumn(safeLineNumber);
					const safeColumn = Math.min(position.column, maxColumn);
					editorRef.current.setPosition({ lineNumber: safeLineNumber, column: safeColumn });
				}
			}
			
			// Restore scroll position
			editorRef.current.setScrollTop(scrollTop);
			
			isUpdatingRef.current = false;
		}
	}, [value]);

	// On change theme
	useEffect(() => {
		if (editorRef.current) {
			monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
		}
	}, [theme]);

	return (
		<div 
			ref={containerRef} 
			className="markdown-editor-monaco"
			id="note-editor"
			{...props}
		/>
	);
});

export default MarkdownEditor;

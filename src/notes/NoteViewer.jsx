import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppSelector } from 'asab_webui_components';
import { Button } from 'reactstrap';
import {
	Card, CardHeader, CardBody,
} from 'reactstrap';

import { MarkdownComponent } from './MarkdownComponent.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import './NoteViewer.scss';

export default function NoteViewer({ 
	app, 
	notePath, 
	setSidebarVisible,
	sidebarVisible
}) {
	if (notePath === null) {
		// No note selected, don't render anything
		return null;
	}

	const tenant = useAppSelector(state => state.tenant?.current);
	const MarkdownNotesAPI = app.axiosCreate("markdown-notes");

	const [editedContent, setEditedContent] = useState('');

	const [viewMode, setViewMode] = useState('preview'); // 'edit', 'preview', 'split'
	
	const editorRef = useRef(null);
	const previewRef = useRef(null);
	const isScrollingSyncRef = useRef(false);

	const [isSaving, setIsSaving] = useState(false);
	const saveTimeoutRef = useRef(null);
	const syncDebounceRef = useRef(null);

	const loadNote = async () => {
		try {
			const response = await MarkdownNotesAPI.get(`${tenant}/note/${notePath}`);
			const noteContent = response.data.data.content;
			setEditedContent(noteContent);
		} catch (err) {
			console.error('Failed to load note:', err);
			if (err.response?.status === 404) {
				app.addAlert('danger', 'Note not found');
			} else {
				app.addAlertFromException(err, 'Failed to load note');
			}
		}
	}

	const saveNote = async (contentToSave) => {
		try {
			await MarkdownNotesAPI.put(`${tenant}/note/${notePath}`, {
				content: contentToSave
			});
			setIsSaving(false);
		} catch (err) {
			app.addAlertFromException(err, 'Failed to save note');
		}
	}

	useEffect(() => {
		setEditedContent('');
		loadNote();

		// Cleanup: clear pending save timeout when switching notes or unmounting
		return () => {
			if (saveTimeoutRef.current) {
				saveTimeoutRef.current = null;
				// Intentionally not clearing the timeout to allow for delayed saves
			}
		};
	}, [notePath]);

	// Handle content changes in editor
	const handleContentChange = (e) => {
		const newContent = e.target.value;
		setEditedContent(newContent);

		setIsSaving(true);

		// Clear any pending save timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = null;
		}
		// Schedule a new save after 1000ms of inactivity
		saveTimeoutRef.current = setTimeout(() => {
			saveNote(newContent);
		}, 1000);
		
		// Sync after content change with small delay to let render complete
		if (syncDebounceRef.current) {
			clearTimeout(syncDebounceRef.current);
			syncDebounceRef.current = null;
		}

		syncDebounceRef.current = setTimeout(() => {
			syncPreviewToEditor();
		}, 50);
	}

	// Sync preview scroll to editor cursor position
	const syncPreviewToEditor = useCallback(() => {
		if (viewMode !== 'split') return;
		if (!editorRef.current || !previewRef.current) return;
		if (isScrollingSyncRef.current) return;

		const editor = editorRef.current;
		const preview = previewRef.current;
		
		// Get cursor position
		const cursorPos = editor.selectionStart;
		const text = editor.value;
		
		// Calculate line number at cursor
		const textBeforeCursor = text.substring(0, cursorPos);
		const currentLine = textBeforeCursor.split('\n').length;

		// Find all elements with data-start-line attribute
		const elementsWithLineInfo = preview.querySelectorAll('[data-start-line]');
		
		if (elementsWithLineInfo.length === 0) return;
		
		// Find the closest element to the current line
		let closestElement = null;
		let closestDistance = Infinity;
		
		elementsWithLineInfo.forEach(element => {
			const startLine = parseInt(element.getAttribute('data-start-line'), 10);
			const endLine = parseInt(element.getAttribute('data-end-line'), 10) || startLine;
			
			// Check if current line is within this element's range
			if (currentLine >= startLine && currentLine <= endLine) {
				// Prefer elements that contain the line, with smaller ranges being more specific
				const range = endLine - startLine;
				if (closestDistance > 0 || range < closestDistance) {
					closestDistance = currentLine >= startLine && currentLine <= endLine ? -range : range;
					closestElement = element;
				}
			} else {
				// Calculate distance to this element
				const distance = currentLine < startLine 
					? startLine - currentLine 
					: currentLine - endLine;
				if (closestDistance > 0 && distance < closestDistance) {
					closestDistance = distance;
					closestElement = element;
				}
			}
		});
		
		if (!closestElement) return;
		
		// Calculate scroll position to put element in top 33% of view
		const elementTop = closestElement.offsetTop;
		const targetOffset = preview.clientHeight * 0.33;
		const targetScroll = elementTop - targetOffset;
		
		// Clamp to valid scroll range
		const maxScroll = preview.scrollHeight - preview.clientHeight;
		const clampedScroll = Math.max(0, Math.min(targetScroll, maxScroll));
		
		// Smooth scroll to position
		isScrollingSyncRef.current = true;
		preview.scrollTo({
			top: clampedScroll,
			behavior: 'smooth'
		});
		
		// Reset sync lock after animation
		setTimeout(() => {
			isScrollingSyncRef.current = false;
		}, 150);
	}, [viewMode]);

	// Handle cursor position changes
	const handleCursorChange = useCallback(() => {
		syncPreviewToEditor();
	}, [syncPreviewToEditor]);

	// Handle editor scroll - sync preview using line position
	const handleEditorScroll = useCallback(() => {
		if (viewMode !== 'split') return;
		if (!editorRef.current || !previewRef.current) return;
		if (isScrollingSyncRef.current) return;

		const editor = editorRef.current;
		const preview = previewRef.current;
		
		const text = editor.value;
		const totalLines = text.split('\n').length;
		
		// Calculate approximate line height and which line is at the top of visible area
		const lineHeight = editor.scrollHeight / totalLines;
		const topLine = Math.floor(editor.scrollTop / lineHeight) + 1;

		// Find all elements with data-start-line attribute
		const elementsWithLineInfo = preview.querySelectorAll('[data-start-line]');
		
		if (elementsWithLineInfo.length === 0) return;
		
		// Find the closest element to the top visible line
		let closestElement = null;
		let closestDistance = Infinity;
		
		elementsWithLineInfo.forEach(element => {
			const startLine = parseInt(element.getAttribute('data-start-line'), 10);
			const endLine = parseInt(element.getAttribute('data-end-line'), 10) || startLine;
			
			// Check if topLine is within this element's range
			if (topLine >= startLine && topLine <= endLine) {
				const range = endLine - startLine;
				if (closestDistance > 0 || range < closestDistance) {
					closestDistance = topLine >= startLine && topLine <= endLine ? -range : range;
					closestElement = element;
				}
			} else {
				// Calculate distance to this element
				const distance = topLine < startLine 
					? startLine - topLine 
					: topLine - endLine;
				if (closestDistance > 0 && distance < closestDistance) {
					closestDistance = distance;
					closestElement = element;
				}
			}
		});
		
		if (!closestElement) return;
		
		// Scroll to put element at top of preview
		const elementTop = closestElement.offsetTop;
		
		// Clamp to valid scroll range
		const maxScroll = preview.scrollHeight - preview.clientHeight;
		const clampedScroll = Math.max(0, Math.min(elementTop, maxScroll));
		
		isScrollingSyncRef.current = true;
		preview.scrollTo({
			top: clampedScroll,
			behavior: 'smooth'
		});
		
		setTimeout(() => {
			isScrollingSyncRef.current = false;
		}, 50);
	}, [viewMode]);

	return (
		<Card className='h-100'>
			<CardHeader className='card-header-flex'>
				<Button color="primary" outline onClick={() => setSidebarVisible(!sidebarVisible)}>
					<i className={`bi ${sidebarVisible ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
				</Button>
				<nav className="note-breadcrumb flex-fill">
					<h3>
						<i className="bi bi-filetype-md me-2 text-info"></i>
						{notePath.split('/').map((segment, index, arr) => (
							<span key={index}>
								{index > 0 && <span className="separator">/</span>}
								<span className={index === arr.length - 1 ? 'current' : 'parent'}>
									{segment}
								</span>
							</span>
						))}
						<span className="separator">.md</span>

						{isSaving && <span className="ps-1 text-warning"><i className="bi bi-floppy2 saving-indicator"></i></span>}
					</h3>
				</nav>

				<Button
					color={viewMode === 'edit' ? 'primary' : 'secondary'}
					outline={viewMode !== 'edit'}
					onClick={() => setViewMode('edit')}
					title="Edit only"
				>
					<i className="bi bi-square-fill"></i>
				</Button>
				<Button
					color={viewMode === 'split' ? 'primary' : 'secondary'}
					outline={viewMode !== 'split'}
					onClick={() => setViewMode('split')}
					title="Split view"
				>
					<i className="bi bi-square-half"></i>
				</Button>
				<Button
					color={viewMode === 'preview' ? 'primary' : 'secondary'}
					outline={viewMode !== 'preview'}
					onClick={() => setViewMode('preview')}
					title="Preview only"
				>
					<i className="bi bi-square"></i>
				</Button>
			</CardHeader>

			<CardBody className='p-0'>
				<div className={`note-viewer-grid h-100 note-viewer-grid-${viewMode}`}>
					{(viewMode === 'edit' || viewMode === 'split') && (
						<MarkdownEditor
							ref={editorRef}
							value={editedContent}
							onChange={handleContentChange}
							onCursorChange={handleCursorChange}
							onScroll={handleEditorScroll}
							placeholder="Start writing your note..."
						/>
					)}
					
					{(viewMode === 'preview' || viewMode === 'split') && (
						<div className="note-viewer-preview" ref={previewRef}>
							<div className="note-content">
								<MarkdownComponent app={app}>{editedContent}</MarkdownComponent>
							</div>
						</div>
					)}
				</div>

			</CardBody>
		</Card>
	);
}

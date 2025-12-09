import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';

import {
	Spinner,
	Input, Button,
	Card, CardHeader, CardBody,
	Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import { useAppSelector } from 'asab_webui_components';

import './DirectoryTree.scss';

// How long a note is considered "recently changed" (in seconds)
const RECENT_CHANGE_THRESHOLD = 60;

function DirectoryItem({ 
	item,
	selectedNote, 
	onRenameNote,
	onDeleteNote,
	onRenameDirectory,
	onDeleteDirectory,
	onCreateNoteInDir,
	onCreateDirInDir,
	level = 0,
	expandedPaths,
	recentlyChangedPaths,
	knownMtimes,
}) {
	const navigate = useNavigate();
	const isDirectory = item.type === 'directory';
	const [isExpanded, setIsExpanded] = useState(expandedPaths.has(item.path));
	
	// Check if this item or any child was recently changed
	const isRecentlyChanged = recentlyChangedPaths.has(item.path);
	const hasRecentlyChangedChild = isDirectory && item.children?.some(
		child => recentlyChangedPaths.has(child.path) || 
		(child.type === 'directory' && hasRecentChanges(child, recentlyChangedPaths))
	);

	// Auto-expand if the selected note is within this directory
	useEffect(() => {
		if (isDirectory && selectedNote && selectedNote.startsWith(item.path + '/')) {
			setIsExpanded(true);
		}
	}, [isDirectory, selectedNote, item.path]);

	// Auto-expand if there are recently changed children
	useEffect(() => {
		if (isDirectory && hasRecentlyChangedChild && !isExpanded) {
			setIsExpanded(true);
		}
	}, [isDirectory, hasRecentlyChangedChild, isExpanded]);

	const handleClick = () => {
		if (isDirectory) {
			setIsExpanded(!isExpanded);
		} else {
			// Remove .md extension for the route
			const notePath = item.path.endsWith('.md') ? item.path.slice(0, -3) : item.path;
			navigate(`/notes/${notePath}`);
		}
	};

	const handleRenameClick = (e) => {
		e.stopPropagation();
		const notePath = item.path.endsWith('.md') ? item.path.slice(0, -3) : item.path;
		const currentName = item.name.replace(/\.md$/, '');
		onRenameNote(notePath, currentName);
	};

	const handleDeleteClick = (e) => {
		e.stopPropagation();
		const notePath = item.path.endsWith('.md') ? item.path.slice(0, -3) : item.path;
		onDeleteNote(notePath);
	};

	const handleRenameDirClick = (e) => {
		e.stopPropagation();
		onRenameDirectory(item.path, item.name);
	};

	const handleDeleteDirClick = (e) => {
		e.stopPropagation();
		onDeleteDirectory(item.path);
	};

	const handleCreateNoteInDirClick = (e) => {
		e.stopPropagation();
		onCreateNoteInDir(item.path);
	};

	const handleCreateDirInDirClick = (e) => {
		e.stopPropagation();
		onCreateDirInDir(item.path);
	};

	const isSelected = !isDirectory && selectedNote === (item.path.endsWith('.md') ? item.path.slice(0, -3) : item.path);
	const displayName = isDirectory ? item.name : item.name.replace(/\.md$/, '');

	return (
		<div className="directory-item">
			<div 
				className={`directory-item-row ${isSelected ? 'selected' : ''} ${isDirectory ? 'is-directory' : 'is-note'} ${isRecentlyChanged ? 'recently-changed' : ''}`}
				style={{ paddingLeft: `${level * 22 + 8}px` }}
				onClick={handleClick}
				title={isRecentlyChanged ? 'Recently modified' : undefined}
			>
				{isDirectory ? (
					<>
						<i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
						<span className="item-name">{displayName}</span>
						{hasRecentlyChangedChild && !isRecentlyChanged && (
							<span className="change-indicator-badge" title="Contains recently modified notes">
								<i className="bi bi-circle-fill"></i>
							</span>
						)}
						<span className="note-actions">
							<Button size="sm" color="primary" outline
								onClick={handleCreateDirInDirClick}
								title="Create directory here"
							>
								<i className="bi bi-folder-plus"></i>
							</Button>
							<Button size="sm" color="primary" outline
								onClick={handleCreateNoteInDirClick}
								title="Create note here"
							>
								<i className="bi bi-file-earmark-plus"></i>
							</Button>
							<Button size="sm" color="primary" outline
								onClick={handleRenameDirClick}
								title="Rename directory"
							>
								<i className="bi bi-pencil"></i>
							</Button>
							<Button size="sm" color="danger" outline 
								onClick={handleDeleteDirClick}
								title="Delete directory"
							>
								<i className="bi bi-trash"></i>
							</Button>
						</span>
					</>
				) : (
					<>
						<i className="bi bi-filetype-md me-2 text-info"></i>
						<span className="item-name">{displayName}</span>
						{isRecentlyChanged && (
							<span className="change-indicator" title="Recently modified">
								<i className="bi bi-circle-fill"></i>
							</span>
						)}
						<span className="note-actions">
							<Button size="sm" color="primary" outline
								onClick={handleRenameClick}
								title="Rename note"
							>
								<i className="bi bi-pencil"></i>
							</Button>
							<Button size="sm" color="danger" outline 
								onClick={handleDeleteClick}
								title="Delete note"
							>
								<i className="bi bi-trash"></i>
							</Button>
						</span>
					</>
				)}
			</div>
			
			{isDirectory && isExpanded && item.children && (
				<div className="directory-children">
					{item.children.map(child => (
						<DirectoryItem
							key={child.path}
							item={child}
							selectedNote={selectedNote}
							onRenameNote={onRenameNote}
							onDeleteNote={onDeleteNote}
							onRenameDirectory={onRenameDirectory}
							onDeleteDirectory={onDeleteDirectory}
							onCreateNoteInDir={onCreateNoteInDir}
							onCreateDirInDir={onCreateDirInDir}
							level={level + 1}
							expandedPaths={expandedPaths}
							recentlyChangedPaths={recentlyChangedPaths}
							knownMtimes={knownMtimes}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// Helper function to check if directory has recent changes recursively
function hasRecentChanges(item, recentlyChangedPaths) {
	if (recentlyChangedPaths.has(item.path)) return true;
	if (item.type === 'directory' && item.children) {
		return item.children.some(child => hasRecentChanges(child, recentlyChangedPaths));
	}
	return false;
}

// Helper function to find which directories should be expanded based on selected note
function getExpandedPaths(selectedNote) {
	const paths = new Set();
	if (!selectedNote) return paths;
	
	const parts = selectedNote.split('/');
	let currentPath = '';
	for (let i = 0; i < parts.length - 1; i++) {
		currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
		paths.add(currentPath);
	}
	return paths;
}

export default function DirectoryTree({app}) {
	const tenant = useAppSelector(state => state.tenant?.current);
	const tree = useAppSelector(state => state.notes.tree);
	const navigate = useNavigate();

	let { "*": selectedNote } = useParams();

	if (tree === "init") {
		// The notes tree has not been loaded yet, show a loading spinner
		return (
			<Card className="directory-tree-container h-100">
				<CardHeader>
					&nbsp;
				</CardHeader>
				<CardBody className="text-center mt-5">
					<Spinner color="primary" />
				</CardBody>
			</Card>
		);
	}

	const MarkdownNotesAPI = app.axiosCreate("markdown-notes");

	const [recentlyChangedPaths, setRecentlyChangedPaths] = useState(new Set());
	const [isCreating, setIsCreating] = useState(false);

	// Rename modal state
	const [renameModalOpen, setRenameModalOpen] = useState(false);
	const [renameNotePath, setRenameNotePath] = useState('');
	const [renameNewName, setRenameNewName] = useState('');
	const [isRenaming, setIsRenaming] = useState(false);
	const [renameError, setRenameError] = useState(null);

	// Delete modal state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteNotePath, setDeleteNotePath] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState(null);

	// Directory rename modal state
	const [renameDirModalOpen, setRenameDirModalOpen] = useState(false);
	const [renameDirPath, setRenameDirPath] = useState('');
	const [renameDirNewName, setRenameDirNewName] = useState('');
	const [isRenamingDir, setIsRenamingDir] = useState(false);
	const [renameDirError, setRenameDirError] = useState(null);

	// Directory delete modal state
	const [deleteDirModalOpen, setDeleteDirModalOpen] = useState(false);
	const [deleteDirPath, setDeleteDirPath] = useState('');
	const [isDeletingDir, setIsDeletingDir] = useState(false);
	const [deleteDirError, setDeleteDirError] = useState(null);

	// Creating directory state
	const [isCreatingDir, setIsCreatingDir] = useState(false);
	
	const knownMtimesRef = useRef({});

	// Clear recently changed indicators after threshold
	useEffect(() => {
		if (recentlyChangedPaths.size === 0) return;

		const timeoutId = setTimeout(() => {
			setRecentlyChangedPaths(new Set());
		}, RECENT_CHANGE_THRESHOLD * 1000);

		return () => clearTimeout(timeoutId);
	}, [recentlyChangedPaths]);

	// Create note in root (header button)
	const handleCreateNoteInRoot = useCallback(async () => {
		if (!tenant || isCreating) return;

		setIsCreating(true);

		try {
			const response = await MarkdownNotesAPI.post(`${tenant}/note-create`, { directory: "" });
			const newNotePath = response.data.data.path;
			
			// Remove .md extension for the route
			const notePath = newNotePath.endsWith('.md') ? newNotePath.slice(0, -3) : newNotePath;
			
			// Refresh the tree to show the new note
			// TODO: await loadTree(false);
			
			// Select/open the new note
			navigate(`/notes/${notePath}`);
		} catch (err) {
			app.addAlertFromException(err, 'Failed to create note');
		} finally {
			setIsCreating(false);
		}
	}, [tenant, isCreating]);

	// Create note in a specific directory (directory hover button)
	const handleCreateNoteInDir = useCallback(async (directory) => {
		if (!tenant || isCreating) return;

		setIsCreating(true);

		try {
			const response = await MarkdownNotesAPI.post(`${tenant}/note-create`, { directory });
			const newNotePath = response.data.data.path;
			
			// Remove .md extension for the route
			const notePath = newNotePath.endsWith('.md') ? newNotePath.slice(0, -3) : newNotePath;
			
			// Refresh the tree to show the new note
			// TODO: await loadTree(false);
			
			// Select/open the new note
			navigate(`/notes/${notePath}`);
		} catch (err) {
			app.addAlertFromException(err, 'Failed to create note');
		} finally {
			setIsCreating(false);
		}
	}, [tenant, isCreating]);

	// Handle opening rename modal
	const handleOpenRenameModal = useCallback((notePath, currentName) => {
		setRenameNotePath(notePath);
		setRenameNewName(currentName);
		setRenameError(null);
		setRenameModalOpen(true);
	}, []);

	// Handle rename submission
	const handleRenameSubmit = useCallback(async () => {
		if (!tenant || !renameNotePath || !renameNewName.trim() || isRenaming) return;

		setIsRenaming(true);
		setRenameError(null);

		try {
			const response = await MarkdownNotesAPI.post(`${tenant}/note-rename`, {
				old_path: renameNotePath,
				new_name: renameNewName.trim()
			});

			const newPath = response.data.data.path;
			// Remove .md extension for route
			const newNotePath = newPath.endsWith('.md') ? newPath.slice(0, -3) : newPath;

			// Refresh the tree
			// TOOD :await loadTree(false);

			// If the renamed note was selected, navigate to the new path
			if (selectedNote === renameNotePath) {
				navigate(`/notes/${newNotePath}`);
			}

			setRenameModalOpen(false);
		} catch (err) {
			console.error('Failed to rename note:', err);
			if (err.response?.status === 409) {
				setRenameError('A note with this name already exists');
			} else {
				setRenameError('Failed to rename note');
			}
		} finally {
			setIsRenaming(false);
		}
	}, [tenant, renameNotePath, renameNewName, isRenaming, selectedNote]);

	// Handle opening delete modal
	const handleOpenDeleteModal = useCallback((notePath) => {
		setDeleteNotePath(notePath);
		setDeleteError(null);
		setDeleteModalOpen(true);
	}, []);

	// Handle delete confirmation
	const handleDeleteConfirm = useCallback(async () => {
		if (!tenant || !deleteNotePath || isDeleting) return;

		setIsDeleting(true);
		setDeleteError(null);

		try {
			await MarkdownNotesAPI.delete(`${tenant}/note/${deleteNotePath}`);

			// Refresh the tree
			// TODO: await loadTree(false);

			setDeleteModalOpen(false);
		} catch (err) {
			console.error('Failed to delete note:', err);
			setDeleteError('Failed to delete note');
		} finally {
			setIsDeleting(false);
		}
	}, [tenant, deleteNotePath, isDeleting, selectedNote]);

	// Create directory in root (header button)
	const handleCreateDirInRoot = useCallback(async () => {
		if (!tenant || isCreatingDir) return;

		setIsCreatingDir(true);

		try {
			await MarkdownNotesAPI.post(`${tenant}/directory-create`, { parent_directory: "" });
			
			// Refresh the tree to show the new directory
			// TODOawait loadTree(false);
		} catch (err) {
			app.addAlertFromException(err, 'Failed to create directory');
		} finally {
			setIsCreatingDir(false);
		}
	}, [tenant, MarkdownNotesAPI, isCreatingDir]);

	// Create directory in a specific directory (directory hover button)
	const handleCreateDirInDir = useCallback(async (parentDirectory) => {
		if (!tenant || isCreatingDir) return;

		setIsCreatingDir(true);

		try {
			await MarkdownNotesAPI.post(`${tenant}/directory-create`, { parent_directory: parentDirectory });
			
			// Refresh the tree to show the new directory
			// TODO: await loadTree(false);
		} catch (err) {
			app.addAlertFromException(err, 'Failed to create directory');
		} finally {
			setIsCreatingDir(false);
		}
	}, [tenant, MarkdownNotesAPI, isCreatingDir]);

	// Handle opening directory rename modal
	const handleOpenRenameDirModal = useCallback((dirPath, currentName) => {
		setRenameDirPath(dirPath);
		setRenameDirNewName(currentName);
		setRenameDirError(null);
		setRenameDirModalOpen(true);
	}, []);

	// Handle directory rename submission
	const handleRenameDirSubmit = useCallback(async () => {
		if (!tenant || !renameDirPath || !renameDirNewName.trim() || isRenamingDir) return;

		setIsRenamingDir(true);
		setRenameDirError(null);

		try {
			const response = await MarkdownNotesAPI.post(`${tenant}/directory-rename`, {
				old_path: renameDirPath,
				new_name: renameDirNewName.trim()
			});

			const newPath = response.data.data.path;

			// Refresh the tree
			// TODO: await loadTree(false);

			// If the selected note was inside the renamed directory, update navigation
			if (selectedNote && selectedNote.startsWith(renameDirPath + '/')) {
				const newNotePath = selectedNote.replace(renameDirPath, newPath);
				navigate(`/notes/${newNotePath}`);
			}

			setRenameDirModalOpen(false);
		} catch (err) {
			console.error('Failed to rename directory:', err);
			if (err.response?.status === 409) {
				setRenameDirError('A directory with this name already exists');
			} else {
				setRenameDirError('Failed to rename directory');
			}
		} finally {
			setIsRenamingDir(false);
		}
	}, [tenant, renameDirPath, renameDirNewName, isRenamingDir, MarkdownNotesAPI, selectedNote]);

	// Handle opening directory delete modal
	const handleOpenDeleteDirModal = useCallback((dirPath) => {
		setDeleteDirPath(dirPath);
		setDeleteDirError(null);
		setDeleteDirModalOpen(true);
	}, []);

	// Handle directory delete confirmation
	const handleDeleteDirConfirm = useCallback(async () => {
		if (!tenant || !deleteDirPath || isDeletingDir) return;

		setIsDeletingDir(true);
		setDeleteDirError(null);

		try {
			await MarkdownNotesAPI.delete(`${tenant}/directory/${deleteDirPath}`);		
			setDeleteDirModalOpen(false);
		} catch (err) {
			console.error('Failed to delete directory:', err);
			setDeleteDirError('Failed to delete directory');
		} finally {
			setIsDeletingDir(false);
		}
	}, [tenant, deleteDirPath, isDeletingDir, selectedNote]);


	const expandedPaths = getExpandedPaths(selectedNote);

	return (
		<Card className="directory-tree-container h-100">
			<CardHeader className='card-header-flex'>
				<div className="flex-fill"> </div>
				<Button color="primary" outline onClick={handleCreateDirInRoot} title="Create directory in root" disabled={isCreatingDir}>
					<i className="bi bi-folder-plus"></i>
				</Button>
				<Button color="primary" outline onClick={handleCreateNoteInRoot} title="Create note in root" disabled={isCreating}>
					<i className="bi bi-file-earmark-plus"></i>
				</Button>
				{/* <Button color="primary" outline onClick={handleRefresh}>
					<i className="bi bi-arrow-clockwise"></i>
				</Button> */}
			</CardHeader>

			<div className="directory-tree">
				{tree.map(item => (
					<DirectoryItem
						key={item.path}
						item={item}
						selectedNote={selectedNote}
						onRenameNote={handleOpenRenameModal}
						onDeleteNote={handleOpenDeleteModal}
						onRenameDirectory={handleOpenRenameDirModal}
						onDeleteDirectory={handleOpenDeleteDirModal}
						onCreateNoteInDir={handleCreateNoteInDir}
						onCreateDirInDir={handleCreateDirInDir}
						level={0}
						expandedPaths={expandedPaths}
						recentlyChangedPaths={recentlyChangedPaths}
						knownMtimes={knownMtimesRef.current}
					/>
				))}
			</div>

			{/* Rename Modal */}
			<Modal isOpen={renameModalOpen} toggle={() => !isRenaming && setRenameModalOpen(false)}>
				<ModalHeader toggle={() => !isRenaming && setRenameModalOpen(false)}>
					Rename Note
				</ModalHeader>
				<ModalBody>
					<Input
						type="text"
						value={renameNewName}
						onChange={(e) => setRenameNewName(e.target.value)}
						placeholder="Enter new name"
						disabled={isRenaming}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && renameNewName.trim()) {
								handleRenameSubmit();
							}
						}}
						autoFocus
					/>
					{renameError && (
						<div className="text-danger mt-2">
							<i className="bi bi-exclamation-triangle me-1"></i>
							{renameError}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={() => setRenameModalOpen(false)} disabled={isRenaming}>
						Cancel
					</Button>
					<Button 
						color="primary" 
						onClick={handleRenameSubmit} 
						disabled={isRenaming || !renameNewName.trim()}
					>
						{isRenaming ? <><Spinner size="sm" /> Renaming...</> : 'Rename'}
					</Button>
				</ModalFooter>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={deleteModalOpen} toggle={() => !isDeleting && setDeleteModalOpen(false)}>
				<ModalHeader toggle={() => !isDeleting && setDeleteModalOpen(false)}>
					Delete Note
				</ModalHeader>
				<ModalBody>
					<p>Are you sure you want to delete <strong>{deleteNotePath}</strong>?</p>
					<p className="text-muted mb-0">This action cannot be undone.</p>
					{deleteError && (
						<div className="text-danger mt-2">
							<i className="bi bi-exclamation-triangle me-1"></i>
							{deleteError}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
						Cancel
					</Button>
					<Button 
						color="danger" 
						onClick={handleDeleteConfirm} 
						disabled={isDeleting}
					>
						{isDeleting ? <><Spinner size="sm" /> Deleting...</> : 'Delete'}
					</Button>
				</ModalFooter>
			</Modal>

			{/* Directory Rename Modal */}
			<Modal isOpen={renameDirModalOpen} toggle={() => !isRenamingDir && setRenameDirModalOpen(false)}>
				<ModalHeader toggle={() => !isRenamingDir && setRenameDirModalOpen(false)}>
					Rename Directory
				</ModalHeader>
				<ModalBody>
					<Input
						type="text"
						value={renameDirNewName}
						onChange={(e) => setRenameDirNewName(e.target.value)}
						placeholder="Enter new name"
						disabled={isRenamingDir}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && renameDirNewName.trim()) {
								handleRenameDirSubmit();
							}
						}}
						autoFocus
					/>
					{renameDirError && (
						<div className="text-danger mt-2">
							<i className="bi bi-exclamation-triangle me-1"></i>
							{renameDirError}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={() => setRenameDirModalOpen(false)} disabled={isRenamingDir}>
						Cancel
					</Button>
					<Button 
						color="primary" 
						onClick={handleRenameDirSubmit} 
						disabled={isRenamingDir || !renameDirNewName.trim()}
					>
						{isRenamingDir ? <><Spinner size="sm" /> Renaming...</> : 'Rename'}
					</Button>
				</ModalFooter>
			</Modal>

			{/* Directory Delete Confirmation Modal */}
			<Modal isOpen={deleteDirModalOpen} toggle={() => !isDeletingDir && setDeleteDirModalOpen(false)}>
				<ModalHeader toggle={() => !isDeletingDir && setDeleteDirModalOpen(false)}>
					Delete Directory
				</ModalHeader>
				<ModalBody>
					<p>Are you sure you want to delete <strong>{deleteDirPath}</strong>?</p>
					<p className="text-danger mb-0">
						<i className="bi bi-exclamation-triangle me-1"></i>
						This will delete all notes and subdirectories inside. This action cannot be undone.
					</p>
					{deleteDirError && (
						<div className="text-danger mt-2">
							<i className="bi bi-exclamation-triangle me-1"></i>
							{deleteDirError}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={() => setDeleteDirModalOpen(false)} disabled={isDeletingDir}>
						Cancel
					</Button>
					<Button 
						color="danger" 
						onClick={handleDeleteDirConfirm} 
						disabled={isDeletingDir}
					>
						{isDeletingDir ? <><Spinner size="sm" /> Deleting...</> : 'Delete'}
					</Button>
				</ModalFooter>
			</Modal>
		</Card>
	);
}

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Container, Row, Col } from 'reactstrap';

import { useAppSelector } from 'asab_webui_components';

import DirectoryTree from './DirectoryTree.jsx';
import NoteViewer from './NoteViewer.jsx';

import './MarkdownNotesScreen.scss';

export default function MarkdownNotesScreen({ app }) {
	const navigate = useNavigate();
	const params = useParams();
	
	// Get the note path from the URL params (using the splat/catch-all param)
	const selectedNote = params['*'] || null;
		
	const [sidebarVisible, setSidebarVisible] = useState(true);

	const handleNoteSelect = (notePath) => {
		// Clear external change flag when selecting a new note
		if (notePath) {
			navigate(`/notes/${notePath}`);
		} else {
			navigate('/notes');
		}
	};

	const handleNoteDeleted = useCallback((deletedNotePath) => {
		// If the deleted note was selected, navigate away
		if (deletedNotePath === selectedNote) {
			navigate('/notes');
		}
	}, [selectedNote, navigate]);


	return (
		<Container fluid className={`h-100 notes-container ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
			<aside className="notes-sidebar h-100 d-flex flex-column">
				<DirectoryTree 
					app={app}
					selectedNote={selectedNote}
					onNoteSelect={handleNoteSelect}
					onNoteChanged={null}
					onNoteDeleted={handleNoteDeleted}
				/>
			</aside>
			<main className="notes-main h-100 d-flex flex-column">
				<NoteViewer 
					app={app}
					notePath={selectedNote}
					setSidebarVisible={setSidebarVisible}
					sidebarVisible={sidebarVisible}
				/>
			</main>
		</Container>
	);
}

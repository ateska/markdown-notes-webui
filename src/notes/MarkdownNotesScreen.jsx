import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Container } from 'reactstrap';


import DirectoryTree from './DirectoryTree.jsx';
import NoteViewer from './NoteViewer.jsx';

import './MarkdownNotesScreen.scss';

export default function MarkdownNotesScreen({ app }) {	
	const [sidebarVisible, setSidebarVisible] = useState(true);
	let { "*": notePath } = useParams();

	return (
		<Container fluid className={`h-100 notes-container ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
			<aside className="notes-sidebar h-100 d-flex flex-column">
				<DirectoryTree 
					app={app}
					selectedNote={notePath}
				/>
			</aside>
			<main className="notes-main h-100 d-flex flex-column">
				<NoteViewer 
					app={app}
					notePath={notePath}
					setSidebarVisible={setSidebarVisible}
					sidebarVisible={sidebarVisible}
				/>
			</main>
		</Container>
	);
}

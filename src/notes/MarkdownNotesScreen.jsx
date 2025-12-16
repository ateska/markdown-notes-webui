import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Container } from 'reactstrap';

import DirectoryTree from './DirectoryTree.jsx';
import NoteViewer from './NoteViewer.jsx';
import ChatPanel from './ChatPanel.jsx';

import './MarkdownNotesScreen.scss';

export default function MarkdownNotesScreen({ app }) {	
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const [chatVisible, setChatVisible] = useState(false);
	let { "*": notePath } = useParams();

	return (
		<Container
			fluid
			className="h-100 notes-container"
			style={{ gridTemplateColumns: `${sidebarVisible ? '25rem' : '0'} 1fr ${chatVisible ? '25rem' : '0'}` }}
		>
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
					setChatVisible={setChatVisible}
					chatVisible={chatVisible}
				/>
			</main>
			<aside className="chat-sidebar h-100 d-flex flex-column">
				<ChatPanel
					app={app}
					notePath={notePath}
				/>
			</aside>
		</Container>
	);
}

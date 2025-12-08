import React from 'react';
import { Module, Service } from 'asab_webui_components';

import NotesReducer from './notes/NotesReducer.jsx';

export default class MarkdownNotesFederationModule extends Module {
	constructor(app) {
		super(app, 'MarkdownNotesFederationModule');
		this.App = app;

		this.MarkdownNotesService = new MarkdownNotesService(app, "MarkdownNotesService");

		// Add the route for the notes screen
		const MarkdownNotesScreen = React.lazy(() => import('./notes/MarkdownNotesScreen.jsx'));
		
		// Route for viewing a specific note (with path parameter)
		app.Router.addRoute({
			path: '/notes/*',
			name: 'Notes',
			component: MarkdownNotesScreen,
			resource: '*',
		});

		// Default route - redirect to notes
		app.Router.addRoute({
			path: '/',
			end: true,
			name: 'Notes',
			component: MarkdownNotesScreen,
			resource: '*',
		});
	}

}

class MarkdownNotesService extends Service {

	constructor(app, service_name) {
		super(app, service_name);
		this.MarkdownNotesAPI = this.App.axiosCreate("markdown-notes");
		this._LoadInterval = null;
		
		app.ReduxService.addReducer("notes", NotesReducer);
	}

	initialize() {
		this.loadNodeTree();
		this._LoadInterval = setInterval(() => {
			this.loadNodeTree();
		}, 10000);
	}

	dispose() {
		// Likely never called, but just in case
		if (this._LoadInterval) {
			clearInterval(this._LoadInterval);
			this._LoadInterval = null;
		}
	}

	async loadNodeTree() {
		const tenant = this.App.AppStore.getState().tenant?.current;
		let response = null;
		try {
			response = await this.MarkdownNotesAPI.get(`${tenant}/tree`);
		}
		catch (error) {
			this.App.addAlertFromException(error, "Error loading node tree", 8); // 8 seconds timeout, less than 10000 ms reload interval to keep the screen clean
			return;
		}
		const tree = response?.data?.data || [];
		this.App.AppStore.dispatch({type: "markdown-notes/setTree", payload: tree});
	}
}

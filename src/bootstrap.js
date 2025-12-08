import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';

const root = createRoot(document.getElementById('app'));

import { Application, I18nModule, TenantModule, AuthModule, AboutModule } from 'asab_webui_shell';

// Load default modules
const modules = [];

modules.push(I18nModule);
modules.push(TenantModule);
modules.push(AuthModule);
modules.push(AboutModule);

import MarkdownNotesFederationModule from "./main";
modules.push(MarkdownNotesFederationModule);

// This is a load of the remote module form a federated application
// If the remote is now available (yarn is not started), the warning is generated to the console and init time continues

// const seacat_admin_webui_main = import('seacat_admin_webui/main');
// modules.push(seacat_admin_webui_main);

// const seacat_account_webui_main = import('seacat_account_webui/main');
// modules.push(seacat_account_webui_main);

// Configuration
let ConfigDefaults = {
	title: "Markdown Notes",
	vendor: "TeskaLabs Ltd",
	website: "https://teskalabs.com",
	email: "info@teskalabs.com",
	help: "https://docs.teskalabs.com/???",
	hasSidebar: false,
	brandImage: {
		light: {
			full: "media/logo/header-logo-full.svg",
			minimized: "media/logo/header-logo-minimized.svg",
		},
		dark: {
			full: "media/logo/header-logo-full-dark.svg",
			minimized: "media/logo/header-logo-minimized-dark.svg"
		}
	},
	sidebarLogo: {
		light: {
			full: "media/logo/sidebar-logo-full.svg",
			minimized: "media/logo/sidebar-logo-minimized.svg"
		},
		dark: {
			full: "media/logo/sidebar-logo-full-dark.svg",
			minimized: "media/logo/sidebar-logo-minimized-dark.svg"
		},
	},
	i18n: {
		fallbackLng: 'en',
		supportedLngs: ['en', 'cs'],
		debug: false,
		nsSeparator: false
	}
};


root.render(
	<HashRouter>
		<Application
			configdefaults={ConfigDefaults}
			modules={modules}
		/>
	</HashRouter>,
);
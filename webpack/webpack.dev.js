var webpack = require('webpack');
const { merge } = require('webpack-merge'); // used to merge 2 different webpack configs into 1
const os = require('os'); // for obtaining the IP address

const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin'); // Load module federation plugin

const commonConfig = require('./webpack.common'); // obtain configuration from webpack.common config
const packageJson = require('../package.json');

const path = require('path');
const CWD = process.cwd();


/*
	TODO: not sure if increasing number of listeners is necessary - this
	is very controversial so handle with care, leaving this commented in
*/
// Increase the maximum number of listeners for EventEmitter
// require('events').EventEmitter.defaultMaxListeners = 25;

// Dev method for getting local IP address of the computer
// It helps with testing on remote localhost (e.g. on different computer)
function getLocalIpAddress() {
	const networkInterfaces = os.networkInterfaces();
	for (const key of Object.keys(networkInterfaces)) {
		for (const interfaceInfo of networkInterfaces[key]) {
			if ((interfaceInfo.family === 'IPv4') && !interfaceInfo.internal) {
				return interfaceInfo.address;
			}
		}
	}
	return 'localhost'; // Default to localhost if no suitable IP address is found
}

const localIpAddress = getLocalIpAddress();

const devConfig = {
	mode: 'development',

	devServer: {
		port: 3100,
		compress: false,

		client: {
			overlay: false // Disable full screen overlay in dev mode (errors will be printer only in console)
		},

		proxy: [
			{
				context: ['/api/markdown-notes'],
				target: 'http://localhost:8898',
				pathRewrite: {'^/api/markdown-notes': ''},
				secure: false, // Ignore certificate errors, trust self-signed certificate
				changeOrigin: true, // Rewrite Host header to bypass CORS policy
				//ws: true,
			},
			{
				context: ['/api/llm-microlink'],
				target: 'http://localhost:8920',
				pathRewrite: {'^/api/llm-microlink': ''},
				secure: false, // Ignore certificate errors, trust self-signed certificate
				changeOrigin: true, // Rewrite Host header to bypass CORS policy
				ws: true,
			},
			{
				context: ['/api/llm'],
				// target: 'http://sp01.teskalabs.int:11434', // ollama
				target: 'http://sp01:8888', // vllm
				pathRewrite: {'^/api/llm': ''},
				secure: false, // Ignore certificate errors, trust self-signed certificate
				// changeOrigin: true, // Rewrite Host header to bypass CORS policy
			},
		],
	},

	plugins: [
		new ModuleFederationPlugin({
			name: 'seacat_pki_webui',
			remotes: {
				"seacat_admin_webui": `seacat_admin_webui@http://${localIpAddress}:3900/remoteEntry.js`,
				"seacat_account_webui": `seacat_account_webui@http://${localIpAddress}:3901/remoteEntry.js`,
			},
			shared: {
				// KEEP THIS ALIGNED WITH package.json
				// The i18next-language-detector is private for the shell application and it is not shared intentionally with federated apps
				"@babel/core": { singleton: true, requiredVersion: packageJson.dependencies['@babel/core'] },
				"@babel/runtime": { singleton: true, requiredVersion: packageJson.dependencies['@babel/runtime'] },
				"@babel/plugin-transform-runtime": { singleton: true, requiredVersion: packageJson.dependencies['@babel/plugin-transform-runtime'] },
				"@popperjs/core": { singleton: true, requiredVersion: packageJson.dependencies['@popperjs/core'] },
				"axios": { singleton: true, requiredVersion: packageJson.dependencies['axios'] },
				"bootstrap": { singleton: true, requiredVersion: packageJson.dependencies['bootstrap'] },
				"bootstrap-icons": { singleton: true, requiredVersion: packageJson.dependencies['bootstrap-icons'] },
				"date-fns": { singleton: true, requiredVersion: packageJson.dependencies['date-fns'] },
				"i18next": { singleton: true, requiredVersion: packageJson.dependencies['i18next'] },
				"react": { singleton: true, requiredVersion: packageJson.dependencies['react'] },
				"react-dom": { singleton: true, requiredVersion: packageJson.dependencies['react-dom'] },
				"react-i18next": { singleton: true, requiredVersion: packageJson.dependencies['react-i18next'] },
				"@microlink/react-json-view": { singleton: true, requiredVersion: packageJson.dependencies['@microlink/react-json-view'] },
				"react-router": { singleton: true, requiredVersion: packageJson.dependencies['react-router'] },
				"reactstrap": { singleton: true, requiredVersion: packageJson.dependencies['reactstrap'] },
				// asab_webui_components is among shared due to Application context is being shared among the federating/federated applications
				"asab_webui_components": {
					singleton: true,
					requiredVersion: packageJson.dependencies['asab_webui_components'], // Disable version checks
				},
				"asab_webui_shell": {
					singleton: true,
					requiredVersion: packageJson.dependencies['asab_webui_shell'],
				},
			}
		}),

		new webpack.DefinePlugin({
			'LOCAL_CONFIG': JSON.stringify({  // Inject the local configuration into the ConfigurationService
				"foo": "bar",
			}),
			'MOCK_USERINFO': JSON.stringify({  // Inject mocked UserInfo object, this means the application will NOT require user authorization (remove 'disabled' to enable)
				"username": "johndev",
				"email": "dev@dev.de",
				"phone": "123456789",
				"resources": ["authz:superuser"],
				"roles": ["default/Admin"],
				"sub": "devdb:dev:1abc2def3456",
				"tenants": ["twist2", "lmiochart"]
			})
		}),
	],

	/*
		- following section should be always part of dev webpack of the container application
		- libraries asab-webui-components-lib and asab-webui-shell-lib should be cloned
		to the same level as microfrontends mono repo (folder)
		- to have asab libraries up to date, always pull the latest main of the library
		- to test the asab libraries installed in the DEV environment, comment-in the
		following resolve/alias section and `rm -rfv node_modules yarn.lock && yarn install`,
		this way the asab libraries will be cured same way as for build action
	*/
	resolve: {
		// alias: {
		// 	"asab_webui_components/seacat-auth": path.resolve(CWD, '..', '..', 'asab-webui-components-lib', 'src', 'seacat-auth'),
		// 	"asab_webui_components": path.resolve(CWD, '..', '..', 'asab-webui-components-lib', 'src'),
		// 	"asab_webui_shell": path.resolve(CWD, '..', '..', 'asab-webui-shell-lib', 'src'),
		// },
	}
}

// Merge common and dev configs
module.exports = merge(commonConfig, devConfig);

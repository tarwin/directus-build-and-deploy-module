import ModuleComponent from './module.vue';

export default {
	id: 'directus-module-deploy',
	name: 'Directus Module Deploy',
	icon: 'cloud_upload',
	routes: [
		{
			path: '/',
			component: ModuleComponent,
		},
	],
};
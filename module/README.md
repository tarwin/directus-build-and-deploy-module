# directus-build-and-deploy-module
A frontend module for Directus that calls a custom endpoint to build and deploy a site

Run `npm run build` to build using Rollup.

This also automatically copies the extension to `../cms/extensions/modules/directus-module-deploy` which may not be how your setup works.

This extension works with a custom endpoint defined @ `/custom/build-and-deploy/`. Example in `/endpoint` - see readme there.

You will also need to change the sites for viewing in the `/src/module.vue` file.

```
		viewStage() {
			window.open('https://stage.mysite.com/')
		},
		viewProd() {
			window.open('https://mysite.com/')
		}
```
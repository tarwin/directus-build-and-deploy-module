<template>
	<private-view title="Deploy">
		<v-error v-if="error" :error="error" />
		<v-skeleton-loader v-if="loading" />
		<div
			v-else
			class="wrap"
		>
			<v-card class="card">
				<v-card-title>Stage</v-card-title>
				<v-card-text>
					<div>Last deployed: {{ `${deployInfo.stage.date_created} UTC` }}</div>
					<div>Status: <strong>{{ deployInfo.stage.status }}</strong></div>
				</v-card-text>
				<v-card-actions>
					<v-button
						@click="viewStage"
						:disabled="deployingStage || deployingProd"
						secondary
					>View</v-button>
					<v-button
						@click="deployStage"
						:loading="deployingStage"
						:disabled="deployingProd"
					>Deploy Stage</v-button>
				</v-card-actions>
			</v-card>

			<v-card class="card">
				<v-card-title>Production</v-card-title>
				<v-card-text>
					<div>Last deployed: {{ `${deployInfo.production.date_created} UTC` }}</div>
					<div>Status: <strong>{{ deployInfo.production.status }}</strong></div>
				</v-card-text>
				<v-card-actions>
					<v-button
						@click="viewProd"
						:disabled="deployingStage || deployingProd"
						secondary
					>View</v-button>
					<v-button
						@click="deployProd"
						:loading="deployingProd"
						:disabled="deployingStage"
					>Deploy Production</v-button>
				</v-card-actions>
			</v-card>
		</div>
	</private-view>
</template>

<script>
export default {
	inject: ['system'],
	data() {
		return {
			error: null,
			fpErrorStage: null,
			fpErrorProd: null,
			loading: true,
			deployingStage: false,
			deployingProd: false,
			deployInfo: {
				stage: {},
				production: {}
			}
		}
	},
	mounted() {
		this.system.api.get('/custom/build-and-deploy/')
		.then(res => {
			console.log(res)
			this.deployInfo = res.data.data
			this.loading = false
		})
		.catch(e => {
			console.error(e)
			this.error = e
		})
	},
	methods: {
		niceNow() {
			var date = new Date(); 
			var d = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
			let ye = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'UTC' }).format(d);
			let mo = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(d);
			let da = new Intl.DateTimeFormat('en', { day: 'numeric', timeZone: 'UTC' }).format(d);
			let time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, timeZone: 'UTC' }).format(d)
			return `${mo} ${da}, ${ye} @ ${time}`;
		},
		deployStage() {
			this.deployingStage = true
			this.fpErrorStage = null
			this.fpErrorProd = null
			this.deployInfo.stage.status = 'deploying'
			this.deployInfo.stage.date_created = this.niceNow()
			this.system.api.get('/custom/build-and-deploy/deploy-stage')
			.then(res => {
				if (res.data.data.error) {
					this.fpErrorStage = res.data.data.message
					this.deployInfo.stage.status = 'error'
					this.deployInfo.stage.date_created = this.niceNow()
				} else {
					this.deployInfo.stage.status = 'deployed'
					this.deployInfo.stage.date_created = this.niceNow()
				}
				console.log(res)
			})
			.catch(e => {
				console.error(e)
				this.error = e
			})
			.finally(() => {
				this.deployingStage = false
			})
		},
		deployProd() {
			this.deployingProd = true
			this.fpErrorStage = null
			this.fpErrorProd = null
			this.deployInfo.production.status = 'deploying'
			this.deployInfo.production.date_created = this.niceNow()
			this.system.api.get('/custom/build-and-deploy/deploy-production')
			.then(res => {
				if (res.data.data.error) {
					this.fpErrorStage = res.data.data.message
					this.deployInfo.production.status = 'error'
					this.deployInfo.production.date_created = this.niceNow()
				} else {
					this.deployInfo.production.status = 'deployed'
					this.deployInfo.production.date_created = this.niceNow()
				}
				console.log(res)
			})
			.catch(e => {
				console.error(e)
				this.error = e
			})
			.finally(() => {
				this.deployingProd = false
			})
		},
		viewStage() {
			window.open('https://stage.mysite.com/')
		},
		viewProd() {
			window.open('https://mysite.com/')
		}
	}
};
</script>

<style scoped>
.wrap {
	padding: var(--content-padding);
	padding-top: 0;
}
.card {
	margin-bottom: 15px;
}
</style>
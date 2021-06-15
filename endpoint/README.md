
# Directus 9 build and deploy endpoint example

Put the `index.js` file in the following location:

`<directus>/extentions/endpoints/build-and-deploy`

Also needs `npm install sqlstring` in your Directus directory.

You may need to restart Directus after doing this, or on any update.

This is made to work with AWS S3 and CloudFront. You will need to change it to work with your system, and this is only given as an example.

Also note this uses the database directly rather than Knex or the API, which should probably be used instead.

## Database

You will need to create a database table `_deployments` like this:

```sql
CREATE TABLE `_deployments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_created` char(36) DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `environment` varchar(255) DEFAULT NULL,
  `status` enum('deploying','deployed','error') DEFAULT NULL,
  `message` text,
  `date_updated` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4
```
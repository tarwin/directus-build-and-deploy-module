const { exec } = require('child_process');
const SqlString = require('sqlstring');

module.exports = function registerEndpoint(router, context) {
  
  const { database } = context

  // status: 'deploying', 'deployed', 'error'

  const getRows = function(data) {
    return data && data[0] || []
  }

  const getFirstRow = function(data) {
    const rows = getRows(data)
    return rows && rows[0] || {}
  }

  const niceExec = async function(cmd, cwd) {
    console.log('\x1b[36m%s\x1b[0m', cmd)
    return new Promise((resolve, reject) => {
      exec(cmd, {
        cwd
      }, function(error, stdout, stderr) {
        if (error) {
          console.log(`error: ${error.message}`);
          return reject(error)
        }
        // if (stderr) {
        //   console.log(`stderr: ${stderr}`);
        //   return reject(stderr)
        // }
        resolve(stdout)
      });
    })
  }

  const updateDbToError = async function(message) {
    return await database.raw(`
      UPDATE
        _deployments
      SET
        status = 'error',
        message = ${SqlString.escape(message)},
        date_updated = NOW()
      WHERE
        status = 'deploying'
    ;`)
  }

  const deployTo = async function(env) {
    // make sure we can deloy ie no one else is currently deploying (stage or prod)
    const deployingData = getFirstRow(await database.raw(`
      SELECT
        id,
        environment,
        DATE_FORMAT(date_created, '%e %M, %Y @ %T') date_created
      FROM
        _deployments
      WHERE
        status = 'deploying'
      ORDER BY
        date_created DESC
      LIMIT 1
    `))

    if (deployingData.id) {
      const err = `Already deploying ${deployingData.environment} - ${deployingData.date_created}`
      console.log(err)
      return {
        error: true,
        message: err
      }
    }

    const addDeployData = await database.raw(`
      INSERT INTO
        _deployments
      (date_created, environment, status)
        VALUES
      (NOW(), '${env}', 'deploying')
    ;`)
    if (!addDeployData[0].insertId) {
      return {
        error: true,
        message: 'Failed to insert new row'
      }
    }

    // build gridsome
    console.log('Building')
    let buildCliOut
    try {
      // build gridsome site
      buildCliOut = await niceExec('node ./node_modules/.bin/gridsome build', '../gridsome')
    } catch (err) {
      console.log(err)
      await updateDbToError(err.message)
      return {
        error: true,
        message: err.message
      }
    }
    console.log(buildCliOut)
    console.log('Built')

    // deploy to S3
    // env = 'production' || 'stage'
    
    console.log('Syncing to S3')
    let syncCliOut
    try {
      const bucket = env === 'production' ? 'mysite.com' : 'stage.mysite.com'
      const cacheControl = env === 'production' ? `--cache-control "public, max-age=300"` : `--cache-control "no-cache"`
      syncCliOut = await niceExec(`aws s3 sync . s3://${bucket} ${cacheControl}`, '../gridsome/dist')
    } catch (err) {
      console.log(err)
      await updateDbToError(err.message)
      return {
        error: true,
        message: err.message
      }
    }
    console.log(syncCliOut)
    console.log('Synced to S3')

    // clear cloudfront
    console.log('Invalidating CloudFront')
    let cloudfrontInvalidateCliOut
    try {
      const distribution = env === 'production' ? 'CLOUDFRONT_DIST_ID_PRODUCTION' : 'CLOUDFRONT_DIST_ID_STAGE'
      cloudfrontInvalidateCliOut = await niceExec(`aws cloudfront create-invalidation --distribution-id ${distribution} --paths "/*"`, './')
    } catch (err) {
      console.log(err)
      await updateDbToError(err.message)
      return {
        error: true,
        message: err.message
      }
    }
    console.log(cloudfrontInvalidateCliOut)
    console.log('CloudFront Invalidated')

    // update db
    await database.raw(`
      UPDATE
        _deployments
      SET
        status = 'deployed',
        date_updated = NOW()
      WHERE
        status = 'deploying'
    ;`)

    // return info
    return {
      error: false,
      message: 'Done',
      data: {}
    }
  }

  // init
	router.get('/', async (req, res) => {
    const stageData = await database.raw(`
      SELECT
        DATE_FORMAT(date_created, '%e %M, %Y @ %T') date_created,
        status
      FROM
        _deployments
      WHERE
        environment = 'stage'
      ORDER BY
        date_created DESC
      LIMIT 1
    `)

    const prodData = await database.raw(`
      SELECT
        DATE_FORMAT(date_created, '%e %M, %Y @ %T') date_created,
        status
      FROM
        _deployments
      WHERE
        environment = 'production'
      ORDER BY
        date_created DESC
      LIMIT 1
    `)

    return res.json({
      error: false,
      message: '',
      data: {
        stage: getFirstRow(stageData),
        production: getFirstRow(prodData),
      }
    })
  });

  router.get('/deploy-stage', async (req, res) => {
    console.log('Deploying to Stage')
    res.json(await deployTo('stage'))
  })

  router.get('/deploy-production', async (req, res) => {
    console.log('Deploying to Production')
    res.json(await deployTo('production'))
  })

};
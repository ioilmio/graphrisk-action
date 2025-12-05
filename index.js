
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper for HTTP requests
function request(method, url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API Error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  try {
    const apiKey = core.getInput('api-key');
    const ecosystem = core.getInput('ecosystem');
    const apiUrl = process.env.GRAPHRISK_API_URL || 'https://graphrisk.io/api'; // Make configurable

    // 1. Context & Identity
    const context = github.context;
    const repositoryUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}`;

    console.log(`Starting scan for ${repositoryUrl} (${ecosystem})...`);

    // 2. Read Manifest
    // TODO: Support various manifest files based on ecosystem
    const manifestFile = 'package.json'; // Fixed for now
    if (!fs.existsSync(manifestFile)) {
      core.setFailed(`Manifest file ${manifestFile} not found.`);
      return;
    }
    const manifestContent = fs.readFileSync(manifestFile, 'utf8');

    // 3. Initiate Scan
    console.log('Initiating async scan...');
    const initResponse = await request('POST', `${apiUrl}/scan/async`, {
      repositoryUrl,
      manifestContent,
      ecosystem
    }, {
      'x-api-key': apiKey
    });

    const scanId = initResponse.scanId;
    const projectId = initResponse.project?.id;
    console.log(`Scan initiated. ID: ${scanId}. Project ID: ${projectId}`);
    console.log('Use this Scan ID to check status via API.');

    // 4. Poll for Completion
    let status = 'PENDING';
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes (10s interval)

    while (status === 'PENDING' && attempts < maxAttempts) {
      await sleep(10000);
      attempts++;

      try {
        const statusRes = await request('GET', `${apiUrl}/scan/${scanId}/status`, null, {
          'x-api-key': apiKey
        });
        status = statusRes.status;
        process.stdout.write('.');
      } catch (e) {
        console.error('Polling error:', e.message);
      }
    }
    console.log('\n');

    if (status !== 'COMPLETED') {
      core.setFailed(`Scan timed out or failed. Status: ${status}`);
      return;
    }

    console.log('Scan completed successfully.');

    // 5. Download SARIF
    console.log('Downloading SARIF report...');
    const sarif = await request('GET', `${apiUrl}/scan/${scanId}/sarif`, null, {
      'x-api-key': apiKey
    });

    fs.writeFileSync('graphrisk.sarif', JSON.stringify(sarif, null, 2));
    console.log('SARIF report saved to graphrisk.sarif');

    // 6. Summary Logic (Fail on Severity?)
    const criticalCount = sarif.runs[0].results.filter(r => r.level === 'error').length;
    if (criticalCount > 0) {
      core.warning(`Found ${criticalCount} critical vulnerabilities.`);
      // core.setFailed('Critical vulnerabilities found.'); // Optional: Fail build
    } else {
      console.log('No critical vulnerabilities found.');
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

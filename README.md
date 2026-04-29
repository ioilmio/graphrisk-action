
# GraphRisk Security Scan

<p align="center">
  <img src="https://graphrisk.io/logo.png" alt="GraphRisk Logo" width="200" />
</p>

**GraphRisk** automates dependency security scanning directly in your GitHub Actions pipeline. It constructs a full dependency graph of your application, identifies transitive vulnerabilities, and uploads the results to the GitHub Security tab via SARIF integration.

## 🚀 Features

*   **Deep Dependency Analysis**: Scans transitive dependencies that other tools miss.
*   **GitHub Security Integration**: Vulnerabilities appear directly in your pull requests and Security tab (SARIF support).
*   **Smart Identity Locking**: Automatically tracks projects by Repository URL to prevent quota abuse.
*   **Zero-Config**: Works out of the box for standard `npm` projects.
*   **Real-Time Progress Tracking**: Watch scan progress with live updates on current step, percentage completion, and vulnerabilities found.

## 📦 Usage

Create a new workflow file in `.github/workflows/graphrisk.yml` (or add to an existing workflow):

```yaml
name: GraphRisk Security Scan
on:
  push:
    branches: [ main, master ]
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'pnpm-lock.yaml'
      - 'yarn.lock'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'pnpm-lock.yaml'
      - 'yarn.lock'

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: GraphRisk Scan
        uses: ioilmio/graphrisk-action@v1.0.2
        with:
          api-key: ${{ secrets.GRAPHRISK_API_KEY }}

      - name: Upload SARIF Artifact
        uses: actions/upload-artifact@v4
        with:
          name: graphrisk-sarif
          path: graphrisk.sarif
```

For non-npm projects, specify the ecosystem and adjust the paths:

**Python (pip):**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'requirements.txt'
      - 'requirements*.txt'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'requirements.txt'
      - 'requirements*.txt'
```

**Python (Poetry):**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'pyproject.toml'
      - 'poetry.lock'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'pyproject.toml'
      - 'poetry.lock'
```

**Python (Pipenv):**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'Pipfile'
      - 'Pipfile.lock'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'Pipfile'
      - 'Pipfile.lock'
```

**Go:**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'go.mod'
      - 'go.sum'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'go.mod'
      - 'go.sum'
```

**Ruby:**
```yaml
on:
  push:
    branches: [ main, master ]
    paths:
      - 'Gemfile'
      - 'Gemfile.lock'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'Gemfile'
      - 'Gemfile.lock'
```

Then specify the ecosystem in the scan step:

```yaml
      - name: GraphRisk Scan
        uses: ioilmio/graphrisk-action@v1.0.2
        with:
          api-key: ${{ secrets.GRAPHRISK_API_KEY }}
          ecosystem: 'pip'  # or 'poetry', 'go', 'rubygems', etc.
```

## 📊 Accessing SARIF Results

The scan generates a `graphrisk.sarif` file in the working directory. To persist or view this file, add one of these steps after the scan:

**Option 1: Upload as Artifact**

```yaml
      - name: GraphRisk Scan
        uses: ioilmio/graphrisk-action@v1.0.2
        with:
          api-key: ${{ secrets.GRAPHRISK_API_KEY }}

      - name: Upload SARIF Artifact
        uses: actions/upload-artifact@v4
        with:
          name: graphrisk-sarif
          path: graphrisk.sarif
```

**Option 2: Upload to GitHub Security Tab**

```yaml
      - name: GraphRisk Scan
        uses: ioilmio/graphrisk-action@v1.0.2
        with:
          api-key: ${{ secrets.GRAPHRISK_API_KEY }}

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: graphrisk.sarif
```

## ⚙️ Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `api-key` | Your GraphRisk API Key (Get one from [GraphRisk Dashboard](https://graphrisk.io/dashboard)) | **Yes** | N/A |
| `ecosystem` | The package ecosystem to scan. Supported: `npm`, `pip`, `pypi`, `poetry`, `pipenv`, `go`, `rubygems`, `bundler` | No | `npm` |
| `timeout` | Maximum time to wait for scan completion in seconds | No | `600` (10 minutes) |
| `project-id` | Explicit Project ID override. Not recommended unless you need to alias projects manually. | No | Auto-detected |

## 🛠️ Setup Instructions

1.  **Get your API Key**:
    *   Log in to [GraphRisk](https://graphrisk.io).
    *   Go to **Settings** -> **API Keys**.
    *   Create a new key (e.g., "CI Pipeline").

2.  **Add Secret to GitHub**:
    *   Go to your Repo **Settings** -> **Secrets and variables** -> **Actions**.
    *   Click **New repository secret**.
    *   Name: `GRAPHRISK_API_KEY`.
    *   Value: `pk_live_...` (your key).

3.  **Run Pipeline**:
    *   Push a commitment to trigger the scan.
    *   Check the **"Security"** tab in your repository to see results!

## ❓ Troubleshooting

### "Project Update Rejected" / 409 Conflict
To prevent abuse, GraphRisk locks a project slot to its initial content baseline. If you attempt to completely swap the application (e.g., delete 90% of dependencies and add new ones) within the same Repo URL, the scan will fail.
*   **Fix**: Create a new repository for the new application or contact support if this is a legitimate refactor.

### "Payment Required" / 402
You have reached your plan's project limit.
*   **Fix**: Upgrade to Pro or purchase "One-Shot Audit" credits in the dashboard.

## 🤝 Contributing

Issues and pull requests are welcome! If you find a bug or have a feature request, please open an issue on GitHub. For pull requests, please ensure your code follows the existing style and includes appropriate tests.

## 📋 Scan Output

During the scan, you'll see real-time progress updates in your GitHub Actions logs:

```
Starting scan for https://github.com/owner/repo (npm)...
Initiating async scan...
Scan initiated. ID: abc-123. Project ID: proj-456
Use this Scan ID to check status via API.
Polling for scan completion (max 600s timeout)...
[30s elapsed] Step: building dependency graph (0%) - 45 dependencies - 570s remaining
[60s elapsed] Step: scanning vulnerabilities (50%) - 45 dependencies - 2 vulnerabilities found - 540s remaining
[90s elapsed] Step: completed (100%) - 45 dependencies - 5 vulnerabilities found - 510s remaining
Scan completed successfully.
Downloading SARIF report...
SARIF report saved to graphrisk.sarif
```

**Progress Steps:**
- `parsing_manifest` - Reading and parsing your dependency manifest
- `building_dependency_graph` - Resolving transitive dependencies
- `scanning_vulnerabilities` - Checking dependencies against vulnerability database
- `completed` - Scan finished, results available

## 📄 License
MIT

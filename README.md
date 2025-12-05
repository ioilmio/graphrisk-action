
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

## 📦 Usage

Add the following step to your `.github/workflows/main.yml`:

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: GraphRisk Scan
    uses: ioilmio/graphrisk-action@v1.0.0
    with:
      api-key: ${{ secrets.GRAPHRISK_API_KEY }}
```

## ⚙️ Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `api-key` | Your GraphRisk API Key (Get one from [GraphRisk Dashboard](https://graphrisk.io/dashboard)) | **Yes** | N/A |
| `ecosystem` | The package ecosystem to scan. Currently supported: `npm`. | No | `npm` |
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

## 📄 License
MIT

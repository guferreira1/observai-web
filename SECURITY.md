# Security Policy

## Supported versions

ObservAI Web is currently pre-1.0. Security fixes target the latest `main` branch and the latest published container image when one exists.

## Reporting a vulnerability

Please do not open a public issue for vulnerabilities.

Report security concerns privately through GitHub Security Advisories when available for this repository. If advisories are not available, contact the maintainer privately and include enough detail to reproduce and assess the issue.

Useful details include:

- Affected version, commit or image tag
- Impacted area, such as authentication, API proxying, secret handling or dependency risk
- Reproduction steps
- Expected and actual behavior
- Any proof-of-concept code with secrets and private data removed

## Scope

Relevant security issues include:

- Exposure of provider tokens, LLM API keys or observability credentials
- Incorrect use of `NEXT_PUBLIC_*` environment variables
- API proxy behavior that can leak data or reach unintended hosts
- Cross-site scripting or unsafe rendering of evidence, traces, logs or chat content
- Dependency vulnerabilities with practical impact on this frontend

Out of scope:

- Vulnerabilities that require already having full control of the deployment host
- Reports based only on missing security headers without an exploitable impact
- Denial-of-service reports that rely on unrealistic traffic volumes without a specific frontend flaw

## Handling expectations

The project aims to acknowledge valid reports within 7 days. Fix timing depends on severity, exploitability and maintainer availability.

Security fixes should avoid exposing reporter details unless the reporter explicitly agrees.

## Deployment guidance

- Use HTTPS in production.
- Keep ObservAI API and provider credentials out of browser-visible configuration.
- Prefer private networking between ObservAI Web and ObservAI API.
- Rotate any credential that may have been exposed in logs, screenshots, issues or pull requests.

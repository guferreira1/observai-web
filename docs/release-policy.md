# Release Policy

ObservAI Web is currently pre-1.0. The package version is `0.1.0`, and releases should stay compatible with semantic versioning while the project stabilizes.

## Versioning

Use semantic versioning:

- Patch: bug fixes, documentation updates and compatible UI or integration fixes.
- Minor: new user-facing features, new supported API fields or meaningful workflow improvements.
- Major: breaking frontend behavior, deployment changes or API contract expectations after a stable `1.0.0` release.

Before `1.0.0`, minor versions may include breaking changes when necessary. Document those changes clearly in release notes.

## Branches and tags

- `main` is the release branch.
- Contributors should work from feature branches and open pull requests into `main`.
- Release tags should use a `v` prefix, for example `v0.1.0`.
- The Docker image tag should match the release tag.

## Validation

Run the standard web checks before cutting a release:

```bash
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

The GitHub CI workflow runs the same checks on pull requests and pushes to `main`.

## Container publishing

The CD workflow is manual and publishes to GitHub Container Registry:

```txt
ghcr.io/<owner>/observai-web:<version>
```

Use the workflow dispatch `image_tag` input with a semantic version such as `v0.1.0`. Publishing `latest` is allowed for the newest stable release only.

Do not publish `latest` for experimental, alpha, beta or release candidate builds.

## Release notes

Each release should include:

- Version and date
- Notable user-facing changes
- API contract changes or compatibility notes
- Deployment or environment variable changes
- Security fixes, when disclosure is appropriate
- Known issues or follow-up work

## Pre-release labels

Use semantic pre-release suffixes for unstable builds:

- `v0.2.0-alpha.1` for early testing
- `v0.2.0-beta.1` for broader testing
- `v0.2.0-rc.1` for release candidates

Pre-release images should not replace the `latest` tag.

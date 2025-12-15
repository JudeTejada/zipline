# Zipline

Download any folder from a public GitHub repo directly to a zip—no clone required.

## Requirements
- Bun 1.3+ (`bun --version` to verify)
- (Optional) GitHub CLI (`gh`) if you want automatic login via browser/device flow

## Install
Global (recommended so you can just run `zipline`):
```bash
bun install -g .
# now usable anywhere as:
zipline --interactive
zipline download <github-folder-url> -o my.zip
```

Local (from repo root):
```bash
bun install
bun run src/cli.ts --interactive
```

## Usage
Interactive:
```bash
zipline --interactive
```
Direct:
```bash
zipline download https://github.com/owner/repo/tree/branch/path -o output.zip --token <ghp_...>
```
Flags:
- `-o, --output <file>`: zip filename (default `download.zip`)
- `-t, --token <token>`: GitHub token (reads `GITHUB_TOKEN`/`GH_TOKEN` automatically)
- `-i, --interactive`: open the guided flow

## Authentication options
The guided flow offers:
1) Use GitHub CLI login (auto-detected from `~/.config/gh/hosts.yml` or `gh auth status --show-token`)
2) Use a saved token (stored at `~/.config/zipline/config.json`)
3) Enter a new token (optionally save)
4) Skip (unauthenticated, but limited to 60 requests/hour)

To get a GitHub CLI login:
```bash
gh auth login
# choose GitHub.com -> HTTPS -> authenticate via browser/device code
```

## Troubleshooting
- **403 rate limit exceeded**: Use a token. Either pick “Use GitHub CLI login” in interactive mode or pass `--token <ghp_...>`. Unauthenticated calls are limited to ~60/hr.
- **CLI doesn’t show “Use GitHub CLI login”**: Ensure `gh` is on PATH (`gh --version`) and you are logged in (`gh auth status --show-token`). We read `~/.config/gh/hosts.yml`; if your config lives elsewhere, set `GH_CONFIG_DIR=/path/to/gh` before running.
- **Invalid URL**: URL must look like `https://github.com/owner/repo/tree/branch/path/to/folder`.
- **Token not saving/removing**: Tokens are stored at `~/.config/zipline/config.json`. Delete that file to clear saved tokens.
- **Permission denied writing zip**: Pick an output path you can write to, or run from a writable directory.
- **Output file exists**: Existing file will be overwritten; change `--output` to avoid conflicts.

## Build a single binary
```bash
bun build --target bun ./src/cli.ts --outdir dist
# run with: bun ./dist/cli.js --interactive
```

## Uninstall (global)
```bash
bun remove -g zipline
```

## Distribute as a package
- Homebrew: build release binaries, publish them to a GitHub release, and create a tap formula. See `docs/distribution.md` for the exact steps and a formula template.
- Global Bun install (already works): `bun install -g https://github.com/<your-org>/<repo>.git`

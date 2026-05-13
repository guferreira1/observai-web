# Git safety rule

## Protected branch

Do not work directly on `main`.

All changes must happen in a dedicated branch.

## Restricted actions

Agents must not perform these actions without explicit owner authorization:

- commit
- push
- pull
- merge
- rebase
- force update
- open pull requests
- change repository settings
- delete branches
- update protected branches

## Safe actions

Agents may:

- read files
- inspect code
- propose changes
- edit locally when asked
- run tests when available
- explain diffs
- document pending work

## Handoff

At the end of work, summarize:

- changed files
- important decisions
- validation performed
- risks or pending items

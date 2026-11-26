# Site generator

All page content lives in `build.mjs` (projects, roles, certificates, skills).
Edit it, then run:

    cd website && node _build/build.mjs

It writes `index.html` (About), `projects/` (index + one folder per project),
`experience/` and `education/`. Shared styles and scripts are in `site/`.

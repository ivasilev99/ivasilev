# Site generator

All page content lives in `build.mjs` (projects, roles, certificates, skills).
Edit it, then run:

    cd website && node _build/build.mjs

It writes `index.html` (About), `projects/` (index + one folder per project),
`experience/` and `education/`. Shared styles and scripts are in `site/`.

## CV

`cv.html` is the source of the CV PDF, styled with the site's tokens and fonts.
Render both copies with:

    website/_build/cv.sh [full-copy.pdf]

It writes the public copy (no phone) to `assets/cv/Ivan-Vasilev-CV.pdf` and the
full copy (with phone) to the given path, default `~/Downloads/Ivan Vasilev CV.pdf`.

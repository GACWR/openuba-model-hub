<div align="center">
  <img src="public/logo-w.png" width="220" alt="OpenUBA Model Hub" />

  # OpenUBA Model Hub

  **The open community registry for User & Entity Behavior Analytics models.**

  Discover, share, and install transparent, inspectable anomaly-detection models
  for the [OpenUBA](https://github.com/GACWR/OpenUBA) platform.

  [![Live](https://img.shields.io/badge/live-openuba.org-199bdc.svg)](https://openuba.org)
  [![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://github.com/GACWR/OpenUBA/blob/master/LICENSE)
  [![Next.js](https://img.shields.io/badge/next.js-16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/tailwind-3.x-06b6d4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
</div>

---

## Table of Contents

- [What is this?](#what-is-this)
- [Features](#features)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Adding a Model](#adding-a-model)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## What is this?

The OpenUBA Model Hub is the marketplace and registry behind
[**openuba.org**](https://openuba.org). It's a statically-exported Next.js site
that presents a searchable catalog of anomaly-detection models — each fully
transparent, with readable source, declared parameters, and a one-line install.

Models are consumed by the `openuba` Python SDK and run inside the OpenUBA
UEBA platform, where their output feeds the rule engine, cases, entities, and
dashboards.

## Features

- **Model catalog** — searchable, filterable grid/list of models by framework and tag.
- **Model pages** — full `MODEL.py` + `model.yaml` source, parameters, and install command.
- **Documentation** — a full docs section at [`/docs`](https://openuba.org/docs): quickstart, concepts, SDK, model format, publishing, and registry reference.
- **Single-file registry** — the entire catalog is driven by `registry/models.json`.
- **Static export** — ships as static HTML/JS, deployable to any static host.

## Documentation

The in-app docs live under [`/docs`](https://openuba.org/docs):

| Page | Topic |
|---|---|
| Introduction | What the Hub is and how the pieces fit |
| Quickstart | Install the SDK, pull a model, run it |
| Core Concepts | Registry, SDK, and platform |
| Installing Models | CLI and Python install flows |
| Python SDK | The `openuba` client reference |
| Model Format | The `MODEL.py` + `model.yaml` contract |
| Publishing a Model | Contribute a model to the catalog |
| Registry Reference | The `registry/models.json` format |

## Tech Stack

| Component | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript 5 |
| UI System | Tailwind CSS 3, class-variance-authority, `cn()` helper |
| Animation | Framer Motion |
| Code display | react-syntax-highlighter (Prism) |
| 3D / visuals | three.js |
| Icons | lucide-react |
| Package manager | pnpm |

## Getting Started

Prerequisites: **Node.js 18+** and **pnpm**.

```bash
pnpm install       # install dependencies
pnpm dev           # start the dev server at http://localhost:3000
pnpm lint          # eslint
pnpm build         # static export to ./out
```

## Project Structure

```
openuba-model-hub/
├── app/
│   ├── page.tsx              # marketing landing page
│   ├── models/               # catalog + model detail pages
│   └── docs/                 # documentation section
├── components/
│   ├── ui/                   # button, badge, input
│   ├── docs/                 # docs primitives (sidebar, code block, prose)
│   └── *.tsx                 # landing-page sections, navbar, footer
├── lib/
│   ├── models.ts             # registry data loading + types
│   └── docs.ts               # docs navigation manifest
├── models/                   # model source (MODEL.py + model.yaml)
├── registry/models.json      # the catalog source of truth
└── public/                   # static assets (logo, favicon, CNAME)
```

## Adding a Model

1. Add your model under `models/<name>/` with a `MODEL.py` and `model.yaml`
   (see the [Model Format](https://openuba.org/docs/model-format) docs).
2. Register it in `registry/models.json`.
3. Open a pull request — a preview deploy lets you verify how it looks.

Full guide: [Publishing a Model](https://openuba.org/docs/publishing).

## Deployment

The site is a static export (`output: "export"` in `next.config.ts`). `pnpm build`
produces a fully static `./out` directory that can be served from any static host
or CDN. The custom domain is configured via `public/CNAME`.

## Contributing

Contributions are welcome — new models, docs improvements, and site fixes. Open
an issue or PR on [GitHub](https://github.com/GACWR/openuba-model-hub), or join
the community on [Discord](https://discord.gg/Ps9p9Wy).

## License

Part of the [OpenUBA](https://github.com/GACWR/OpenUBA) project by the Georgia
Cyber Warfare Range, licensed under
[Apache 2.0](https://github.com/GACWR/OpenUBA/blob/master/LICENSE).

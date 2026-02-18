# MusicSheet

A simple, locally-hosted app for organizing and viewing your sheet music collection.

## What is this?

MusicSheet is a fast, responsive PDF viewer designed specifically for musicians. Upload your sheet music PDFs, add metadata (composer, instrument, title), and access them instantly. It just works.

## Features

- **Fast & Responsive** - Built with Next.js 15 and React 19 for instant loading
- **Clean Interface** - Intuitive design that gets out of your way
- **Local-First** - All your files stay on your machine
- **Smart Organization** - Search, sort, and filter by title, composer, or instrument
- **PDF Viewer** - Side-by-side page view optimized for reading sheet music
- **Zero Config** - Open it up and start uploading PDFs immediately

## Quick Start

```bash
# Install dependencies
npm install

# Launch the app (auto-opens in browser)
npm run open
```

The app will start on port 3847 and automatically open in your default browser.

## Manual Start

If you prefer to start manually:

```bash
./start.sh
```

Or use Next.js directly on port 3000:

```bash
npm run dev
```

## Data Storage

All documents and metadata are stored locally in the `data/` directory. Your PDFs never leave your machine.

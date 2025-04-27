# gh-dir-clone

**A fast and lightweight Node.js CLI tool to clone a specific directory from any public GitHub repository.**

No need to clone the entire repo — just get the folder you need.

![Image of CLI In action](https://i.imgur.com/C3QzagG.png)


## Features

- Clone only a specific directory from a GitHub repository

- No Git installation required

- Works on Linux, Windows and MacOS

- Supports choosing branches

- Lightweight and fast

## Prerequisites

Before using ghdirclone, make sure you have:

- Node.js v16 or higher installed

- A working internet connection

- Access to the public GitHub repository you want to clone from

## Instalation

### npm:
```bash
npm install -g ghdirclone
```

### pnpm:
```bash
pnpm install -g ghdirclone
```

### yarn:
```bash
yarn global add ghdirclone
```

## Usage

```bash
ghdirclone <owner/repo> <path/in/repo> [options]
```

### Example:
```bash
ghdirclone vercel/next.js examples/with-typescript -b canary -o ./output
```

## Options
| Option                  | Description                  | Default    |
|--------------------------|-------------------------------|------------|
| `-b`, `--branch <branch>` | Specify branch to fetch from  | `main`     |
| `-o`, `--output <output>` | Set output folder             | `name of the cloning directory` |

## Author

Created by **Tim Smans**.
Feel free to contribute or suggest improvements!

## Todo
If you have any requests to add please leave a message in the discussions tab of the repository

- Add support for private repositories
- Add a way to support the github API personal access tokens


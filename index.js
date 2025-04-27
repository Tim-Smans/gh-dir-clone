import axios from 'axios';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

const program = new Command();

program
    .name('gitdirclone')
    .description('Clone a specific directory from a github repo')
    .argument('<repo>', 'Github repo in the form <Owner>/<Repo>')
    .argument('<directory>', 'Path to the directory inside the repo')
    .option('-b, --branch <branch>', 'Branch name', 'main')
    .option('-o, --output <output>', 'Output directory', './basedOutput')
    .parse(process.argv);


const [repo, directory] = program.args;
const options = program.opts();
const spinner = ora();

const BASE_URL = 'https://api.github.com/repos';

const fetchDirectory = async (owner, repo, dirPath, branch, outputPath) => {
    spinner.start(`Fetching directory ${dirPath} from ${repo}@${branch}`);
    try {
      const res = await axios.get(`${BASE_URL}/${owner}/${repo}/contents/${dirPath}?ref=${branch}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });
  
      const items = res.data;
  
      outputPath = getOutputDirectory(outputPath, dirPath)

      await fs.mkdir(outputPath, { recursive: true });
  
      for (const item of items) {
        if (item.type === 'file') {
          const fileRes = await axios.get(item.download_url, { responseType: 'arraybuffer' });
          const filePath = path.join(outputPath, item.name);
          await fs.writeFile(filePath, fileRes.data);
          spinner.succeed(`Downloaded ${item.path}`);
        } else if (item.type === 'dir') {
          await fetchDirectory(owner, repo, item.path, branch, path.join(outputPath, item.name));
        }
      }
  
      spinner.succeed(chalk.green(`Directory ${dirPath} successfully cloned.`));
    } catch (err) {
      spinner.fail(chalk.red(`Failed to fetch directory: ${err.message}`));
      process.exit(1);
    }

}


const getOutputDirectory = (baseDir, repoDir) => {
    if(baseDir !== "./basedOutput"){
        return baseDir;
    }

    const pathArray = repoDir.split('/')

    return pathArray.at(-1)

}

const [owner, repository] = repo.split('/');
  
await fetchDirectory(owner, repository, directory, options.branch, options.output);

spinner.succeed(chalk.bgCyan.bold("Finished cloning into: ") + chalk.bgGreen.bold(`'${getOutputDirectory(directory, repository)}'`) + chalk.bgCyan.bold(" directory!"))

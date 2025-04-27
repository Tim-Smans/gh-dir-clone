import axios from 'axios';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';


/*
Using Command from Commander to register a new CLI command. We give it a name,
description, the arguments and some options and parse the command.
*/
const program = new Command();
program
    .name('gitdirclone')
    .description('Clone a specific directory from a github repo')
    .argument('<repo>', 'Github repo in the form <Owner>/<Repo>')
    .argument('<directory>', 'Path to the directory inside the repo')
    .option('-b, --branch <branch>', 'Branch name', 'main')
    .option('-o, --output <output>', 'Output directory', './basedOutput')
    .parse(process.argv);


// We read the arguments from our command.
const [repo, directory] = program.args;
const options = program.opts();
// We use this to display the fancy CLI spinners.
const spinner = ora();

const BASE_URL = 'https://api.github.com/repos';

/*
This function will retrieve the directory using the github API,
it takes the owner of the repo, the repo itself and the directory path.
As well as posibly the branch and outputh path to retrieve the directory and download
it to the local device.
*/
const fetchDirectory = async (owner, repo, dirPath, branch, outputPath) => {
    spinner.start(`Fetching directory ${dirPath} from ${repo}@${branch}`);
    try {
      const res = await axios.get(`${BASE_URL}/${owner}/${repo}/contents/${dirPath}?ref=${branch}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });
  
      const items = res.data;
  
      outputPath = getOutputDirectory(outputPath, dirPath)

      await fs.mkdir(outputPath, { recursive: true });
  
      await downloadItems(items, outputPath, owner, repo, branch);
  
      spinner.succeed(chalk.green(`Directory ${dirPath} successfully cloned.`));
    } catch (err) {
      spinner.fail(chalk.red(`Failed to fetch directory: ${err.message}`));
      process.exit(1);
    }

}

/*
This function starts out by checking if an option for a custom directory was given.
If it was not it will get the repository directory path and take the last keyword of the path
as a directory name on the local machine.
*/
const getOutputDirectory = (baseDir, repoDir) => {
    if(baseDir !== "./basedOutput"){
        return baseDir;
    }

    const pathArray = repoDir.split('/')

    return pathArray.at(-1)

}

/*
Uses fs to download the files from the api response and save them locally to the right path
*/
const downloadItems = async (items, outputPath, owner, repo, branch) => {
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
}

const [owner, repository] = repo.split('/');
  
await fetchDirectory(owner, repository, directory, options.branch, options.output);

spinner.succeed(chalk.bgCyan.bold("Finished cloning into: ") + chalk.bgGreen.bold(`'${getOutputDirectory(directory, repository)}'`) + chalk.bgCyan.bold(" directory!"))


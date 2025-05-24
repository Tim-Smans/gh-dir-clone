import axios from 'axios';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import Conf from 'conf';

const config = new Conf({
  projectName: 'ghdirclone'
});

const program = new Command();
program
  .name('gitdirclone')
  .description('Clone a specific directory from a github repo')
  .version('1.0.2');

program
  .command('clone')
  .description('Clone a directory from a GitHub repository')
  .argument('<repo>', 'Github repo in the form <Owner>/<Repo>')
  .argument('<directory>', 'Path to the directory inside the repo')
  .option('-b, --branch <branch>', 'Branch name', 'main')
  .option('-o, --output <output>', 'Output directory', './basedOutput')
  .action(async (repo, directory, options) => {
    const [owner, repository] = repo.split('/');
    await fetchDirectory(owner, repository, directory, options.branch, options.output);
  });

program
  .command('config')
  .description('Configure GitHub Personal Access Token')
  .option('-t, --token <token>', 'GitHub Personal Access Token')
  .option('-r, --remove', 'Remove stored token')
  .action((options) => {
    if (options.remove) {
      config.delete('githubToken');
      console.log(chalk.green('GitHub token removed successfully'));
      return;
    }
    
    if (options.token) {
      config.set('githubToken', options.token);
      console.log(chalk.green('GitHub token saved successfully'));
      return;
    }
    
    console.log(chalk.yellow('Current token status: ') + 
      (config.has('githubToken') ? chalk.green('Configured') : chalk.red('Not configured')));
  });

const spinner = ora();
const BASE_URL = 'https://api.github.com/repos';

const fetchDirectory = async (owner, repo, dirPath, branch, outputPath) => {
  spinner.start(`Fetching directory ${dirPath} from ${repo}@${branch}`);
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    // Add token to headers if configured
    const token = config.get('githubToken');
    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const res = await axios.get(`${BASE_URL}/${owner}/${repo}/contents/${dirPath}?ref=${branch}`, {
      headers
    });

    const items = res.data;
    outputPath = getOutputDirectory(outputPath, dirPath);
    await fs.mkdir(outputPath, { recursive: true });
    await downloadItems(items, outputPath, owner, repo, branch);
    
    spinner.succeed(chalk.green(`Directory ${dirPath} successfully cloned.`));
  } catch (err) {
    if (err.response?.status === 404) {
      spinner.fail(chalk.red('Directory not found. If this is a private repository, please configure a GitHub token:'));
      console.log(chalk.yellow('\nghdirclone config -t <your-github-token>'));
    } else {
      spinner.fail(chalk.red(`Failed to fetch directory: ${err.message}`));
    }
    process.exit(1);
  }
};

const getOutputDirectory = (baseDir, repoDir) => {
  if (baseDir !== "./basedOutput") {
    return baseDir;
  }
  const pathArray = repoDir.split('/');
  return pathArray.at(-1);
};

const downloadItems = async (items, outputPath, owner, repo, branch) => {
  for (const item of items) {
    if (item.type === 'file') {
      const headers = {};
      const token = config.get('githubToken');
      if (token) {
        headers.Authorization = `token ${token}`;
      }
      
      const fileRes = await axios.get(item.download_url, { 
        responseType: 'arraybuffer',
        headers 
      });
      const filePath = path.join(outputPath, item.name);
      await fs.writeFile(filePath, fileRes.data);
      spinner.succeed(`Downloaded ${item.path}`);
    } else if (item.type === 'dir') {
      await fetchDirectory(owner, repo, item.path, branch, path.join(outputPath, item.name));
    }
  }
};

program.parse();
import { existsSync, renameSync, readFileSync, writeFileSync } from 'fs';
import { resolve, relative, sep } from 'path';
import { execSync } from 'child_process';

const action = process.argv[2];
const readmePath = resolve(process.cwd(), 'README.md');
const backupPath = readmePath + '.bak';

if (action === 'restore') {
  if (existsSync(backupPath)) {
    renameSync(backupPath, readmePath);
    console.log('Restored original README.md');
  }
  process.exit(0);
}

if (action === 'prepare') {
  // Dynamically find the root of the git repository
  const repoRoot = execSync('git rev-parse --show-toplevel').toString().trim();
  const content = readFileSync(readmePath, 'utf8');

  // Match Markdown links: [text](./relative/path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const modifiedContent = content.replace(linkRegex, (match, text, link) => {
    // Skip absolute URLs and anchor tags
    if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) {
      return match;
    }

    // Resolve the link relative to the current file, then relative to the repo root
    const absoluteTarget = resolve(process.cwd(), link);
    const relativeToRepo = relative(repoRoot, absoluteTarget).split(sep).join('/');
    
    // Construct the absolute GitHub URL
    const absoluteUrl = `https://github.com/oneadera/react-fatless-form/blob/main/${relativeToRepo}`;
    
    return `[${text}](${absoluteUrl})`;
  });

  // Backup the original and write the modified version
  writeFileSync(backupPath, content);
  writeFileSync(readmePath, modifiedContent);
  console.log('Rewrote relative links to absolute GitHub URLs for publishing.');
}
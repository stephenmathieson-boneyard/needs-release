#!/usr/bin/env node

var program = require('commander');
var commits = require('./').commits;

program
  .version(require('./package.json').version)
  .usage('[options] <slug ...>')
  .option('-n, --commits [n]', 'number of commits', parseInt)
  .option('-u, --username [username]', 'GitHub username')
  .option('-p, --password [password]', 'GitHub password');

program.on('--help', function () {
  console.log('  Examples:');
  console.log();
  console.log('    # auth via command line');
  console.log('    $ needs-release -u myusername -p mypassword someuser/repo');
  console.log();
  console.log('    # use ~/.netrc when possible');
  console.log('    $ needs-release someuser/repo1 someuser/repo2');
  console.log();
  console.log('    # brace expansion ftw :)');
  console.log('    $ needs-release someuser/{repo1,repo2}');
  console.log();
});

program.parse(process.argv);

if (!program.args.length) program.help();

var max = program.commits || 5;

next(0);
function next(index) {
  var slug = program.args[index];
  if (!slug) return console.log();
  var fn = program.username
    ? commits.bind(null, slug, {
        login: program.username,
        password: program.password
      })
    : commits.bind(null, slug);

  fn(function (err, unreleased) {
    if (err) throw err;
    var n = unreleased.length;

    console.log();
    console.log('  %s has %d unreleased commits.', slug, n);
    if (max < unreleased.length) {
      console.log('  → A release should be published soon!');
    }

    next(++index);
  });
}


/**
 * Module dependencies.
 */

var Github = require('github');
var netrc = require('netrc');
var assert = require('assert');

exports.commits = unreleasedCommits;

/**
 * Get recent (un-released) commits from the GitHub
 * repository resolved by the given `slug`.
 *
 * If given an `auth` object, will use basic authentication
 * when accessing the GitHub API.  If no `auth` is given,
 * will attempt to use the credentials stored in ~/.netrc,
 * or fallback to unauthorized requests.
 *
 * Example:
 *
 *     // no auth
 *     unreleasedCommits('someuser/somerepo', function (err, commits) {
 *       if (err) throw err;
 *       console.log('%d unreleased commits', commits.length);
 *     });
 *
 * @api public
 * @param {String} slug
 * @param {Object} {auth}
 * @param {Function} fn
 */

function unreleasedCommits(slug, auth, fn) {
  var parts = slug.split('/');
  var username = parts[0];
  var repo = parts[1];
  assert(username && repo, 'user/repo slug required');

  // no auth provided: try netrc
  if ('function' == typeof auth) {
    fn = auth;
    auth = netrc()['github.com'];
  }

  var github = new Github({ version: '3.0.0' });

  // auth
  if (auth && auth.login) {
    github.authenticate({
      type: 'basic',
      username: auth.login || auth.username,
      password: auth.password
    });
  }

  var req = {
    user: username,
    repo: repo,
    per_page: 1,
  };
  github.repos.getTags(req, function (err, tags) {
    if (err) return fn(err);
    var tag = tags[0];
    if (!tag) return fn(new Error('no tags exist'));
    var req = {
      user: username,
      repo: repo,
      sha: tag.commit.sha,
    };
    github.gitdata.getCommit(req, function (err, commit) {
      if (err) return fn(err);
      var req = {
        user: username,
        repo: repo,
        since: commit.author.date,
      };
      github.repos.getCommits(req, function (err, commits) {
        if (err) return fn(err);
        commits = commits.filter(function (commit) {
          return tag.commit.sha != commit.sha;
        });
        fn(null, commits);
      });
    });
  });
}

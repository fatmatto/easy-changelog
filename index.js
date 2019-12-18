const git = require('simple-git')(process.cwd())
const getopts = require('getopts')
const fs = require('fs')
const path = require('path')
const options = getopts(process.argv.slice(2), {
  alias: {
    help: 'h',
    out: 'o'
  },
  default: {
    out: 'STDOUT'
  }
})

function panic (error) {
  console.log(`Got an unexpected error:\n ${error}`)
}

git.getRemotes(true, (err, remotes) => {
  if (err) {
    return panic(err)
  }
  let remote = '/'
  if (remotes && remotes[0] && remotes[0].refs && remotes[0].refs.fetch) {
    remote = remotes[0].refs.fetch
  }
  git.log((err, result) => {
    if (err) {
      return panic(err)
    }
    result.all.reverse()
    const list = []
    result.all.forEach(log => {
      log.commitUrl = getCommitUrl(remote, log.hash)
      log.date = formatDate(log.date)
      list.push(log)

      if (log.refs && log.refs.indexOf('tag') > -1) {
        log.isTag = true
        list.forEach(item => {
          if (item.refs === '') {
            item.refs = log.refs
          }
        })
      }
    })
    const content = listToString(list.reverse())
    writeOutput(content)
  })
})

function writeOutput (output) {
  if (options.out === 'STDOUT') {
    console.log(output)
  } else {
    let filepath = options.out
    if (!path.isAbsolute(filepath)) {
      filepath = path.join(process.cwd(), filepath)
    }
    console.log('Generating output to ' + filepath)
    fs.writeFileSync(options.out, output)
  }
}

function formatDate (dateString) {
  const d = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}
function refsToHeader (refs) {
  const r = refs.replace('tag: ', '')
  return `📦 ${r}`
}

function getCommitUrl (remote, hash) {
  return remote.replace('.git', '/commit/' + hash)
}

function listToString (list) {
  let str = ''
  let currentTag = ''

  list
    .filter(item => {
      return item.refs !== '' && item.refs.match(new RegExp(/\d\.\d\.\d/))
    })
    .forEach(item => {
      const newRef = item.refs.match(new RegExp(/\d\.\d\.\d/))[0]
      if (currentTag !== newRef) {
        str += `# ${refsToHeader(newRef)} (${item.date})\n`
        currentTag = newRef
      }
      str += `- [${item.hash.substr(0, 5)}](${item.commitUrl})  ${item.message}\n`
    })
  return str
}

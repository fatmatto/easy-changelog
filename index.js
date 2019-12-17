const git = require('simple-git')(process.cwd())

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
    console.log(listToString(list.reverse()))
  })
})


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
      if (currentTag !== item.refs) {
        str += `# ${refsToHeader(item.refs)} (${item.date})\n`
        currentTag = item.refs
      }
      str += `- [${item.hash.substr(0, 5)}](${item.commitUrl})  ${item.message}\n`
    })
  return str
}

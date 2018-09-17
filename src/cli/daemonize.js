const os = require('os')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const stop = require('./stop')
const {
  PID_FILE,
  BIN_FILE,
  WAIT_TIME,
  MAX_WAIT_TIME,
  ERROR_FILE_NAME,
  LOG_FILE_NAME,
} = require('./constants')

const RUNNING_ON_NODE = /node$/.test(process.execPath)
const NODE_BIN_PATH = path.join(__dirname, BIN_FILE)
const PID_PATH = path.join(os.tmpdir(), PID_FILE)
const BIN_PATH = RUNNING_ON_NODE ? NODE_BIN_PATH : process.execPath

const waitForChild = (pid, totalWait = 0) => {
  if (!fs.existsSync(PID_PATH)) {
    if (totalWait >= MAX_WAIT_TIME) {
      console.error('Failed to start tiny-kafka, check ./tiny-kafka.error for more information')
      return process.exit(1)
    }

    return setTimeout(() => waitForChild(pid, totalWait + WAIT_TIME), WAIT_TIME)
  }
}

module.exports = ({ log = false }) => {
  stop()
  const stdio = ['ignore']
  log ? stdio.push(fs.openSync(LOG_FILE_NAME, 'a')) : stdio.push('ignore')
  stdio.push(fs.openSync(ERROR_FILE_NAME, 'a'))

  const cmdArgs = []

  if (!RUNNING_ON_NODE) {
    // pkg is removing the entrypoint so it has to be added again
    // https://github.com/zeit/pkg/issues/376
    cmdArgs.push(NODE_BIN_PATH)
  }

  cmdArgs.push('start')

  const child = spawn(BIN_PATH, cmdArgs, {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    shell: true,
    stdio,
  })

  child.unref()
  waitForChild(child.pid)
  process.stdout.write(`${child.pid}\r`)
}

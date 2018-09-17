const os = require('os')
const fs = require('fs')
const path = require('path')
const util = require('util')
const childProcess = require('child_process')
const exec = util.promisify(childProcess.exec)

const { PID_FILE } = require('../src/cli/constants')

const BINARY_NAME = process.platform === 'darwin' ? 'tiny-kafka-macos' : 'tiny-kafka-linux'
const BINARY = path.join(__dirname, '../dist', BINARY_NAME)

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

describe('tiny-kafka binary', () => {
  test('help', async () => {
    await exec(`${BINARY} --help`)
  })

  test('start', async () => {
    const child = childProcess.spawn(BINARY, ['start'])
    try {
      await sleep(3000)
      expect(child.exitCode).toEqual(null)
    } finally {
      child && process.kill(child.pid)
    }
  })

  test('start -d', async () => {
    let serverPid
    const out = await exec(`${BINARY} start -d`)
    try {
      await sleep(3000)
      serverPid = out.stdout.toString().replace(/\s*/g, '')
      expect(serverPid).toMatch(/\d+/)

      const savedPid = fs.readFileSync(path.join(os.tmpdir(), PID_FILE)).toString()
      expect(savedPid).toEqual(serverPid)
    } finally {
      serverPid && process.kill(serverPid)
    }
  })

  test('stop', async () => {
    let serverPid
    const out = await exec(`${BINARY} start -d`)
    try {
      await sleep(3000)
      serverPid = out.stdout.toString().replace(/\s*/g, '')
      await exec(`${BINARY} stop`)

      expect(fs.existsSync(path.join(os.tmpdir(), PID_FILE))).toEqual(false)
      serverPid = null
    } finally {
      serverPid && process.kill(serverPid)
    }
  })
})

const createLog = require('../../../test/test-log')
const createMessageStore = require('../index')
const uuidValidate = require('uuid-validate')
const { generateGetLastSuite } = require('../../test/get-last-test-suite')
const { generateReadSuite } = require('../../test/read-test-suite')
const { generateWriteSuite } = require('../../test/write-test-suite')
const {
  exampleWriteMessageData,
  exampleStreamName
} = require('../../examples')

describe('message-store-memory', () => {
  generateGetLastSuite({ createMessageStore })
  generateReadSuite({ createMessageStore })
  generateWriteSuite({ createMessageStore })

  let store, log
  beforeEach(() => {
    log = createLog()
    store = createMessageStore({ log })
  })

  const read = (...args) => {
    return readFrom(store, ...args)
  }

  const readFrom = async (aStore, streamName, position) => {
    const found = []
    for await (const message of aStore.read(streamName, position)) {
      found.push(message)
    }
    return found
  }

  describe('reading stream that does not exist', () => {
    it('returns no messages', async () => {
      const found = await read('stream-123')

      expect(found).toHaveLength(0)
    })
  })

  describe('write message to stream', () => {
    let position, streamName, writeMessage
    beforeEach(async () => {
      writeMessage = exampleWriteMessageData()
      streamName = exampleStreamName()
      position = await store.write(writeMessage, streamName)
    })

    it('can be retrieved', async () => {
      const found = await read(streamName)
      expect(found).toHaveLength(1)
      expect(found[0]).toEqual({
        id: writeMessage.id,
        type: writeMessage.type,
        data: writeMessage.data,
        metadata: writeMessage.metadata,
        streamName,
        position: 0,
        globalPosition: expect.any(Number),
        time: expect.any(Date)
      })
    })

    it('returns the position', () => {
      expect(position).toBe(0)
    })
  })

  describe('stream without id', () => {
    it('writes the category as the stream name', async () => {
      const streamName = exampleStreamName(null, 'none')
      await store.write(exampleWriteMessageData(), streamName)

      const found = await read(streamName)

      expect(found[0].streamName).toBe(streamName)
    })
  })

  describe('message without id', () => {
    it('generates id', async () => {
      const streamName = exampleStreamName()
      const writeMessage = exampleWriteMessageData()
      delete writeMessage.id
      await store.write(writeMessage, streamName)

      const readMessage = (await read(streamName))[0]

      expect(uuidValidate(readMessage.id)).toBe(true)
    })
  })

  describe('positions', () => {
    describe('within a stream', () => {
      let found
      beforeEach(async () => {
        const streamName = exampleStreamName()
        await store.write([exampleWriteMessageData(), exampleWriteMessageData()], streamName)

        found = await read(streamName)
      })

      it('position increases', () => {
        expect(found.map(m => m.position)).toEqual([0, 1])
      })

      it('globalPosition increases', () => {
        expect(found.map(m => m.globalPosition)).toEqual([0, 1])
      })
    })

    describe('across streams', () => {
      let found
      beforeEach(async () => {
        const streamName1 = exampleStreamName()
        await store.write([exampleWriteMessageData(), exampleWriteMessageData()],
          streamName1)

        const streamName2 = exampleStreamName()
        await store.write([exampleWriteMessageData(), exampleWriteMessageData()],
          streamName2)

        found = await read(streamName2)
      })

      it('position resets', () => {
        expect(found.map(m => m.position)).toEqual([0, 1])
      })

      it('globalPosition increases', () => {
        expect(found.map(m => m.globalPosition)).toEqual([2, 3])
      })
    })
  })

  describe('duplicate message id', () => {
    it('is an error', async () => {
      const streamName = exampleStreamName()
      const message = exampleWriteMessageData()
      await store.write(message, streamName)

      await expect(store.write(message, streamName)).rejects.toEqual(new Error(
        `message-store write: duplicate message id: ${message.id}`))
    })
  })
})

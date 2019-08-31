const createLog = require('../../test/test-log')
const { createConsumerHandlerRegistry } = require('../consumer-handler-registry')
const { exampleHandler, exampleMessageClass, exampleReadMessageData } = require('../examples')

const HandledMessageClass = exampleMessageClass('HandledMessageClass')
const UnhandledMessageClass = exampleMessageClass('UnhandledMessageClass')

const setup = ({ strict } = {}) => {
  const handler = exampleHandler()
  const log = createLog()
  const registry = createConsumerHandlerRegistry({
    name: 'MyConsumer',
    log,
    strict
  })
  registry.register(HandledMessageClass, handler)

  return { handler, log, registry }
}

describe('consumer-handler-registry', () => {
  describe('register', () => {
    describe('given a handle method expecting multiple parameters', () => {
      it('raises an error', () => {
        const badHandler = () => {}
        const { registry } = setup()

        expect(() => {
          registry.register(UnhandledMessageClass, badHandler)
        }).toThrow('MyConsumer consumer: invalid handler, function must accept 1 parameter')
      })
    })
  })

  describe('handle', () => {
    describe('handler found for message', () => {
      const setupHandlerFound = async () => {
        const vars = setup()
        const messageData = exampleReadMessageData(HandledMessageClass)

        await vars.registry.handle(messageData)

        return { ...vars, messageData }
      }

      it('calls the handler function with the message instance', async () => {
        const { handler, messageData } = await setupHandlerFound()

        expect(handler.calls).toHaveLength(1)
        const callMessage = handler.calls[0]
        expect(callMessage).toBeInstanceOf(HandledMessageClass)
        expect(callMessage).toMatchObject(messageData.data)
      })

      it('logs handling of the message', async () => {
        const { log, messageData } = await setupHandlerFound()

        expect(log.info).toHaveBeenCalledWith({
          consumerName: 'MyConsumer',
          messageId: messageData.id,
          messageType: 'HandledMessageClass'
        }, 'MyConsumer consumer: handled HandledMessageClass message')
      })
    })

    describe('unable to find handler for message', () => {
      describe('not-strict consumer', () => {
        it('ignores the message', async () => {
          const { registry } = setup()
          const messageData = exampleReadMessageData(UnhandledMessageClass)

          await registry.handle(messageData)
        })

        it('logs handling of the message', async () => {
          const { log, registry } = setup()
          const messageData = exampleReadMessageData(UnhandledMessageClass)

          await registry.handle(messageData)

          expect(log.info).toHaveBeenCalledWith({
            consumerName: 'MyConsumer',
            messageId: messageData.id,
            messageType: 'UnhandledMessageClass'
          }, 'MyConsumer consumer: ignored UnhandledMessageClass message')
        })
      })

      describe('strict consumer', () => {
        it('raises error', async () => {
          const { registry } = setup({ strict: true })
          const messageData = exampleReadMessageData(UnhandledMessageClass)

          const promise = registry.handle(messageData)

          await expect(promise).rejects.toThrow(
            'MyConsumer consumer: UnhandledMessageClass handler not found for strict consumer MyConsumer')
        })
      })
    })
  })
})
import { parentPort } from 'node:worker_threads'
import StreamInletWorker from './StreamInletWorker.js'

const worker = new StreamInletWorker()

parentPort?.on('message', async (msg: InletMessage) => {
    try {
        switch (msg.type) {
            case 'createInlet':
                const { payload } = msg
                await worker.createInlet(payload)
                parentPort?.postMessage({ type: 'ready' })
                break

            case 'startPulling':
                worker.startPulling((samples, timestamps) => {
                    parentPort?.postMessage({
                        type: 'data',
                        samples,
                        timestamps,
                    })
                })
                break

            case 'flushQueue':
                worker.flushQueue()
                break

            case 'stopPulling':
                worker.stopPulling()
                break

            case 'destroyInlet':
                worker.destroyInlet()
                parentPort?.close()
                break
        }
    } catch (err) {
        parentPort?.postMessage({
            type: 'error',
            error: err instanceof Error ? err.message : String(err),
        })
    }
})

export type InletMessage =
    | {
          type: 'createInlet'
          payload: CreateInletPayload
      }
    | {
          type: 'startPulling'
      }
    | {
          type: 'flushQueue'
      }
    | {
          type: 'stopPulling'
      }
    | {
          type: 'destroyInlet'
      }

export interface CreateInletPayload {
    sourceId: string
    chunkSize: number
    maxBufferedMs: number
    openStreamTimeoutMs: number
    waitAfterOpenStreamMs: number
    pullTimeoutMs: number
    waitBetweenPullsMs: number
    flushQueueOnStop: boolean
}

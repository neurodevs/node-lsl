import { parentPort } from 'node:worker_threads'

import { LiblslAdapter, Liblsl, OutletHandle } from '@neurodevs/ndx-native'

import handleError, { LslErrorCode } from '../../../lib/handleError.js'
import LslStreamInfo, {
    StreamInfo,
    StreamInfoOptions,
} from '../../LslStreamInfo.js'

let lsl = LiblslAdapter.getInstance()

export function setOutletLiblslAdapter(adapter: Liblsl) {
    LiblslAdapter.setInstance(adapter)
    lsl = LiblslAdapter.getInstance()
}

let handleErrorFn = handleError

export function setOutletHandleError(fn: typeof handleError) {
    handleErrorFn = fn
}

let info: StreamInfo
let handle: OutletHandle
let pushMethod: (opts: unknown) => LslErrorCode

parentPort?.on('message', (msg: OutletMessage) => {
    const { type } = msg

    try {
        switch (type) {
            case 'createOutlet': {
                createOutlet(msg)
                break
            }

            case 'pushSample': {
                pushSample(msg)
                break
            }

            case 'destroyOutlet': {
                destroyOutlet()
                break
            }
        }
    } catch (err) {
        parentPort?.postMessage({
            type: 'error',
            error: err instanceof Error ? err.message : String(err),
        })
    }
})

export function createOutlet(msg: {
    type: 'createOutlet'
    payload: CreateOutletPayload
}) {
    const { payload } = msg

    info = LslStreamInfo.Create(payload.infoOptions)

    handle = lsl.createOutlet({
        infoHandle: info.infoHandle,
        chunkSize: payload.chunkSize,
        maxBufferedMs: payload.maxBufferedMs,
    })

    pushMethod = (
        lsl[payload.pushMethod] as (opts: unknown) => LslErrorCode
    ).bind(lsl)

    parentPort?.postMessage({ type: 'ready' })
}

export function pushSample(msg: {
    type: 'pushSample'
    payload: PushSamplePayload
}) {
    const { payload } = msg
    const { sample, timestamp = lsl.localClock() } = payload

    if (!handle || !pushMethod) {
        throw new Error('Outlet not initialized')
    }

    const errorCode = pushMethod({
        outletHandle: handle,
        sample,
        timestamp,
    })

    try {
        handleErrorFn(errorCode)
    } catch {
        parentPort?.postMessage({
            type: 'error',
            error: `Error pushing sample: ${LslErrorCode[errorCode]}`,
        })
    }
}

export function destroyOutlet() {
    if (handle) {
        lsl.destroyOutlet({ outletHandle: handle })
    }

    if (info) {
        lsl.destroyStreamInfo({ infoHandle: info.infoHandle })
    }

    parentPort?.close()
}

export type OutletMessage =
    | {
          type: 'createOutlet'
          payload: CreateOutletPayload
      }
    | {
          type: 'pushSample'
          payload: PushSamplePayload
      }
    | {
          type: 'destroyOutlet'
      }

export interface CreateOutletPayload {
    infoOptions: StreamInfoOptions
    chunkSize: number
    maxBufferedMs: number
    pushMethod: 'pushSampleFloatTimestamp' | 'pushSampleStringTimestamp'
}

export interface PushSamplePayload {
    sample: unknown
    timestamp?: number
}

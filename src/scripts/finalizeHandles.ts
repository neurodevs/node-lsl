export type DestroyHandle = () => void // Do not make this async

const destroyHandles = new Set<DestroyHandle>()

let isFinalizing = false

export function register(destroy: DestroyHandle) {
    if (isFinalizing) {
        destroy()
        return
    }

    destroyHandles.add(destroy)

    const unregister = () => {
        destroyHandles.delete(destroy)
    }

    return unregister
}

function finalizeHandles() {
    if (isFinalizing) {
        return
    }
    isFinalizing = true

    for (const destroy of destroyHandles) {
        try {
            destroy()
        } catch (err) {
            console.error('Error during finalization:', err)
        }
    }

    destroyHandles.clear()
}

process.once('SIGINT', finalizeHandles)

process.once('SIGTERM', finalizeHandles)

process.once('uncaughtException', (err) => {
    console.error('Uncaught exception:', err)
    finalizeHandles()
    process.exit(1)
})

process.once('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason)
    finalizeHandles()
    process.exit(1)
})

process.once('beforeExit', () => {
    if (destroyHandles.size > 0 && !isFinalizing) {
        console.warn(
            'Warning: process is exiting with active handles.\n' +
                'Did you forget to call destroy()? Finalizing automatically.'
        )
        finalizeHandles()
    }
})

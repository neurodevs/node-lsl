import UsbDeviceController from '../impl/controllers/UsbDeviceController.js'

console.info('\nCreating UsbDeviceController...')

const controller = UsbDeviceController.Create({
    serialNumber: 'DP04WG8J',
    onData: (_data: Buffer, length: number, timestampSec: number) => {
        console.info(`[${timestampSec}] Buffer length: ${length}`)
    },
})

console.info('Connecting to UsbDeviceController...')

await controller.connect()

console.info('Waiting for 10 seconds...')

await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Done!')

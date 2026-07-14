import UsbDeviceController from '../impl/UsbDeviceController.js'

console.info('\nCreating UsbDeviceController...')

const controller = UsbDeviceController.Create({ serialNumber: 'DP04WG8J' })

console.info('Connecting to UsbDeviceController...')

await controller.connect()

console.info('Waiting for 10 seconds...')

await new Promise((resolve) => setTimeout(resolve, 10000))

console.info('Done!')

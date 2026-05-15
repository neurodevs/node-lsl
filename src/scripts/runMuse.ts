import BleDeviceController from '../impl/controllers/BleDeviceController.js'

const muse = await BleDeviceController.Create({
    deviceUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    characteristicCallbacks: {},
})

await muse.connect()

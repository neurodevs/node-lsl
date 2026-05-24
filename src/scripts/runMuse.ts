import BleDeviceController from '../impl/controllers/BleDeviceController.js'

const CONTROL_UUID = '273E0001-4C4D-454D-96BE-F03BAC821358'

const muse = await BleDeviceController.Create({
    deviceUuid: 'CA6A61B7-B7A8-AF24-3C9E-04A6A5012554',
    characteristicCallbacks: {},
})

await muse.connect()

await new Promise((resolve) => setTimeout(resolve, 3000))

for (const cmd of ['h', 'p50', 's', 'd']) {
    await muse.writeCharacteristic(CONTROL_UUID, cmd)
    await new Promise((resolve) => setTimeout(resolve, 100))
}

await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

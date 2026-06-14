import koffi from 'koffi'

import BleDeviceController from '../impl/controllers/BleDeviceController.js'

const MUSE_CHARACTERISTIC_UUIDS: Record<string, string> = {
    CONTROL: '273E0001-4C4D-454D-96BE-F03BAC821358',
    TELEMETRY: '273E000B-4C4D-454D-96BE-F03BAC821358',
    GYROSCOPE: '273E0009-4C4D-454D-96BE-F03BAC821358',
    ACCELEROMETER: '273E000A-4C4D-454D-96BE-F03BAC821358',
    PPG_AMBIENT: '273E000F-4C4D-454D-96BE-F03BAC821358',
    PPG_INFRARED: '273E0010-4C4D-454D-96BE-F03BAC821358',
    PPG_RED: '273E0011-4C4D-454D-96BE-F03BAC821358',
    EEG_TP9: '273E0003-4C4D-454D-96BE-F03BAC821358',
    EEG_AF7: '273E0004-4C4D-454D-96BE-F03BAC821358',
    EEG_AF8: '273E0005-4C4D-454D-96BE-F03BAC821358',
    EEG_TP10: '273E0006-4C4D-454D-96BE-F03BAC821358',
    EEG_AUX: '273E0007-4C4D-454D-96BE-F03BAC821358',
}

const CONTROL_UUID = MUSE_CHARACTERISTIC_UUIDS['CONTROL']

const charCallbacks = Object.entries(MUSE_CHARACTERISTIC_UUIDS).map(
    ([name, uuid]) => {
        return {
            charUuid: uuid,
            charName: name,
            onData: (data: Buffer, length: number, timestamp: number) => {
                const bytes = koffi.decode(data, 'uint8', length) as number[]
                console.info(`[${timestamp}] length=${length}`, bytes)
            },
        }
    }
)

const muse = await BleDeviceController.Create({
    deviceNamePrefix: 'Muse',
    charCallbacks,
    rssiIntervalMs: 1000,
})

await muse.connect()

for (const cmd of ['h', 'p50', 's', 'd']) {
    await muse.writeCharacteristic(CONTROL_UUID, cmd)
    await new Promise((resolve) => setTimeout(resolve, 100))
}

await new Promise((resolve) => setTimeout(resolve, 5 * 1000))

await muse.disconnect()

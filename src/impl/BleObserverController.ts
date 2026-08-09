export default class BleObserverController implements BleObserver {
    public static Class?: BleObserverConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface BleObserver {}

export type BleObserverConstructor = new () => BleObserver

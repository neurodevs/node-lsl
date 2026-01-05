export default class LslBackpressureMonitor implements BackpressureMonitor {
    public static Class?: BackpressureMonitorConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface BackpressureMonitor {}

export type BackpressureMonitorConstructor = new () => BackpressureMonitor

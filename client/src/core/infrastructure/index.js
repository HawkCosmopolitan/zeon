import { subscribe, unsubscribe } from "../bus";

export function wireInfrastructure(topic, onFire) {
    const wire = subscribe(topic, data => {
        onFire(data);
    });
    return { cut: () => unsubscribe(wire) };
}

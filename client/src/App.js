
import api from './core/api';
import { Memory, useMemory } from "./core/memory";

export default function App() {
    let data = useMemory().state();
    return (
        <div>
            {data.counter.value}
            <button onClick={() => {
                // api.auth.verify('mohammadi_keyhan@outlook.com', res => {
                //     if (!res.user) {
                //         api.auth.setup('mohammadi_keyhan@outlook.com', 'kasper', 'ahmadi', res => {

                //         });
                //     }
                // });
                Memory.startTrx().increase().commit();
            }}>test !</button>
        </div>
    );
}


import { useEffect } from 'react';
import api from './core/api';
import { authenticate } from './core/api/auth';
import { Memory, useMemory } from "./core/memory";

export default function App() {
    let data = useMemory().state();
    useEffect(() => {

    }, []);
    return (
        <div>
            <button onClick={() => {
                api.auth.verify('mohammadi_keyhan@outlook.com', res => {
                    if (!res.user) {
                        api.auth.setup('mohammadi_keyhan@outlook.com', 'kasper', 'ahmadi', res => {
                            authenticate();
                        });
                    } else {
                        authenticate();
                    }
                });
            }}>auth !</button>
            <button onClick={() => {
                api.spaces.createTower('test room', -1, true, res => {
                    console.log(res);
                });
            }}>space !</button>
        </div>
    );
}

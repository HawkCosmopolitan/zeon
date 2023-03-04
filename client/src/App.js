
import { useEffect } from 'react';
import api from './core/api';
import { authenticate } from './core/api/auth';
import { Memory, useMemory } from "./core/memory";

let myRoom;

export default function App() {
    return (
        <div>
            <button onClick={() => {
                api.auth.verify('keyhan', res => {
                    if (!res.user) {
                        api.auth.setup('keyhan', 'kasper', 'ahmadi', res => {
                            authenticate();
                        });
                    } else {
                        authenticate();
                    }
                });
            }}>auth !</button>
            <button onClick={() => {
                api.spaces.createTower('test tower', -1, true, resTower => {
                    api.spaces.createRoom('test room', -1, true, resTower.id, 'main', resRoom => {
                        myRoom = resRoom;
                    })
                });
            }}>space !</button>
            <input type={'file'} onChange={e => {
                api.file.uploadFile('test', e.target.files[0], myRoom.id, true, res => {
                    console.log(res);
                });
            }} />
        </div>
    );
}

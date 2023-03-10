
import React from 'react';
import api from './core/api';
import { authenticate } from './core/api/auth';
import { Memory, useMemory } from "./core/memory";

let myRoom;

const afterAuthentication = () => {
    api.auth.teleport(Memory.startTrx().temp.rooms.listPerTower['CENTRAL_TOWER'][0].id, () => {

    });
}

export default function App() {
    return (
        <div>
            <button onClick={() => {
                api.auth.verify('keyhan', res => {
                    if (!res.user) {
                        api.auth.setup('keyhan', 'keyhan', 'ahmadi', res => {
                            authenticate(afterAuthentication);
                        });
                    } else {
                        authenticate(afterAuthentication);
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
            <button onClick={() => {
                api.auth.teleport(Memory.startTrx().temp.rooms.listPerTower['CENTRAL_TOWER'][0].id, () => {

                });
            }}>teleport to center !</button>
            <button onClick={() => {
                api.shell.echo('hello echo god !').then(res => {
                    console.log(res);
                });
            }}>echo !</button>
        </div>
    );
}

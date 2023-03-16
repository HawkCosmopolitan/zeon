
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
                api.auth.verify('9', res => {
                    if (!res.user) {
                        api.auth.setup('9', '9', 'ahmadi', res => {
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
                api.interactions.createInteraction('e69cf59b10e10c50b7d812e533e40e45', (interaction, room, contact) => {
                    myRoom = room;
                });
            }}>interact !</button>
            <button onClick={() => {
                api.auth.teleport(myRoom.id, () => {

                });
            }}>teleport !</button>
            <button onClick={() => {
                api.shell.echo(myRoom.id, 'hello echo god !').then(res => {
                    console.log(res);
                });
            }}>echo !</button>
        </div>
    );
}

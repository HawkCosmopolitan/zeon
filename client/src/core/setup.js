
import { setupSocket } from './network/socket';
import { setupDB } from './storage/setup';
import { Component } from 'react';
import { MemoryWrapper } from './memory';

export class Core extends Component {
    started = false;
    memoryInitialValue = {};
    async loadCore() {
        if (!this.started) {
            this.started = true;
            setupDB();
            setupSocket();
        }
    }
    constructor(props) {
        super(props);
        this.loadCore = this.loadCore.bind(this);
        this.loadCore();
    }
    render() {
        return (
            <>
                <MemoryWrapper />
                {this.props.children}
            </>
        );
    }
};

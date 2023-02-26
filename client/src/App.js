import { Component } from "react";
import api from './core/api';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        return (
            <div>
                Core of Zeon Client
                <button onClick={() => {
                    api.auth.verify('mohammadi_keyhan@outlook.com', res => {
                        console.log(res);
                    });
                }}>test !</button>
            </div>
        );
    }
}

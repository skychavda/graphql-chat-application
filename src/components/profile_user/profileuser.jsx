import React from 'react';
import './profileuser.css';

class ProfileUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            colors: ["#bccad6", "#8d9db6", "#667292", "#f1e3dd", "#cfe0e8", "#b7d7e8", "#87bdd8", "#daebe8"]
        }
    }

    componentDidMount() {
        this.extractFirstName();
        this.getColor();
    }

    extractFirstName() {
        const data = this.props.userName;
        const firstName = data.charAt(0);
        return firstName;
    }

    getColor() {
        const {length} = this.state.colors;
        let randomNum = Math.floor(Math.random() * length);
        let mColor = this.state.colors[randomNum];
        return mColor;
    }

    render() {
        return (
            < div id="profileImage" style={{ backgroundColor: this.getColor() }}> {this.extractFirstName()}</div >
        );
    }
}

export default ProfileUser;
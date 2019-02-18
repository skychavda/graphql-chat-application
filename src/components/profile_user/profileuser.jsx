import React from 'react';
import './profileuser.css';

class ProfileUser extends React.Component{
    constructor(props){
        super(props);
        
    }

    componentDidMount(){
        this.extractFirstName();        
    }

    extractFirstName(){
        const data = this.props.userName;
        const firstName = data.charAt(0);
        return firstName;
    }

    render(){
        return(<div id="profileImage">{this.extractFirstName()}</div>);
    }
}

export default ProfileUser;
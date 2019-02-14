import React from 'react';
// import {Query} from 'react-apollo';
// import {gql} from 'apollo-boost';

// const USER = gql`
//     query ShowUser($user:String!){
//         users(userName: $user){
//             name
//             id
//         }
//     }
// `;

class SearchUser extends React.Component{
    constructor(props){
        super(props);
        this.state={
            username: ''
        }
    }

    handleUserName(e){
        this.setState({username: e.target.value})
    }

    render(){
        return(
            <div>
                <input type="text" onChange={(e)=>this.handleUserName(e)}/>
            </div>
        );
    }
}

export default SearchUser;
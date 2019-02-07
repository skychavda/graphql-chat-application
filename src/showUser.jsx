import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";

import CreateChat from './createChat';

const SHOW_USER = gql`
    query ShowUser($user:String!){
        users(userName: $user){
            name
            id
        }
  }
`;

const INITIAL_CHAT = gql`
    mutation InitializeChat($senderName:String!,$receiverName:String!){
        userChat(senderName:$senderName,receiverName:$receiverName){
            chatUserId
        }
    }
`;

const USER_JOIN_SUBSCRIPTION = gql`
    subscription {
        userJoined{
            name
            id
        }
    }
`;

class ShowUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            receiverName: '',
            userId: '',
            display: 'hidden',
            triggerSubscription: false,
            subscribedNewUser: false
        }
        this.initializeChat = this.initializeChat.bind(this);
    }

    async initializeChat(name,userChat) {
        let result = await userChat({ variables: { senderName: this.props.user, receiverName: name } });
        this.setState({ receiverName: name, userId: result.data.userChat.chatUserId, display: 'show', triggerSubscription: true });
        this.disable = true;
    }

    _subscribeNewUser = subscribeToMore => {
        subscribeToMore({
            document: USER_JOIN_SUBSCRIPTION,
            updateQuery: (prev, { subscriptionData }) => {
                console.log("inside update query");
                if (!subscriptionData.data) return prev;
                const newName = subscriptionData.data.userJoined;
                return prev.users.push(newName);
            }
        })
        this.setState({subscribedNewUser:true})
    }
    render() {
        return (
            <div className={(this.props.hidden === "show" ? "" : "hidden")}>
                <h3 style={{ margin: "20px 0 0 20px" }}>Welcome {this.props.user}</h3>
                <div className="display-user">
                    <div className="user-title">Chat with your friends</div>
                    <div className="user-list">
                        <Query query={SHOW_USER} variables={{user: this.props.user}}>  
                            {({ loading, error, data, subscribeToMore }) => {
                                if (loading) {
                                    return <div>loading</div>
                                }
                                if (error) {
                                    return `${error}`
                                }

                                if(!this.state.subscribedNewUser){
                                    this._subscribeNewUser(subscribeToMore)
                                }

                                return data.users.map(user => (
                                    <div style={{ width: "100%" }}>
                                        <h5 className="user-name" key={user.id}>{user.name}</h5>
                                        <Mutation mutation={INITIAL_CHAT}>
                                            {userChat => (
                                                <button className="user-button" onClick={()=>this.initializeChat(user.name,userChat)}>Chat</button>
                                            )}
                                        </Mutation>
                                    </div>
                                ))
                            }}
                        </Query>
                    </div>
                </div>
                {
                    this.state.triggerSubscription && <CreateChat receiverName={this.state.receiverName} senderName={this.props.user} userId={this.state.userId} hidden={this.state.display} />
                }

            </div>
        );
    }
}

export default ShowUser;
import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import './showuser.css';

import CreateChat from '../create_chat/createChat';
import SearchUser from '../search_user/searchuser';
// import NewMessage from '../newmessage';

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
            subscribedNewUser: false,
            userActive: false
        }
        this.initializeChat = this.initializeChat.bind(this);
    }

    async initializeChat(name, userChat) {
        let result = await userChat({ variables: { senderName: this.props.user, receiverName: name } });
        this.setState({ receiverName: name, userId: result.data.userChat.chatUserId, display: 'show', triggerSubscription: true, userActive: true });
        this.disable = true;
    }

    _subscribeNewUser = subscribeToMore => {
        subscribeToMore({
            document: USER_JOIN_SUBSCRIPTION,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const newName = subscriptionData.data.userJoined;
                return prev.users.push(newName);
            }
        })
        this.setState({ subscribedNewUser: true })
    }
    render() {
        return (
            <div className={"row " + (this.props.hidden === "show" ? "" : "hidden")}>
                <div className="display-user col-md-4 col-lg-3">
                    <div className="user-title">Welcome {this.props.user}</div>
                    <SearchUser/>
                    <div className="user-list">
                        <Query query={SHOW_USER} variables={{ user: this.props.user }}>
                            {({ loading, error, data, subscribeToMore }) => {
                                if (loading) {
                                    return <div>loading</div>
                                }
                                if (error) {
                                    return `${error}`
                                }

                                if (!this.state.subscribedNewUser) {
                                    this._subscribeNewUser(subscribeToMore)
                                }
                                
                                if (this.state.receiverName === '') {
                                    this.setState({ receiverName: data.users[0].name, userId: data.users[0].id });
                                    // <Mutation mutation={INITIAL_CHAT}>
                                    //     {(userChat) => this.initializeChat(data.users[0].name, userChat)}
                                    // </Mutation>
                                }
                                return data.users.map(user => (
                                    <ul class="list">
                                        <li class="clearfix">
                                            <div class="about">
                                                <Mutation mutation={INITIAL_CHAT}>
                                                    {userChat => (
                                                        <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.name, userChat)}>{user.name}</div>
                                                    )}
                                                </Mutation>
                                            </div>
                                        </li>
                                    </ul>
                                ))
                            }}
                        </Query>
                    </div>
                </div>
                {/* {this.props.user && <NewMessage receiverName={this.state.receiverName} senderName={this.props.user} userId={this.state.userId} hidden={this.state.display} />} */}
                {
                    <CreateChat receiverName={this.state.receiverName} senderName={this.props.user} userId={this.state.userId} hidden={this.state.display} />
                }

            </div>
        );
    }
}

export default ShowUser;
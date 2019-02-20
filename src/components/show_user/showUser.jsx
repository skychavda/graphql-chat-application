import React from "react";
import { Mutation, compose, graphql, withApollo } from "react-apollo";
import gql from "graphql-tag";
import './showuser.css';
import { Scrollbars } from 'react-custom-scrollbars';

import CreateChat from '../create_chat/createChat';
import SearchUser from '../search_user/searchuser';
import ProfileUser from '../profile_user/profileuser';
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
        this.messagesList = React.createRef();
        this.state = {
            receiverName: '',
            userId: '',
            display: 'hidden',
            triggerCreateChat: false,
            subscribedNewUser: false,
            userList: [],
            filterUserList: []
        }
        this.initializeChat = this.initializeChat.bind(this);
        this.filterUser = this.filterUser.bind(this);
    }

    async initializeChat(name, userChat) {
        let result = await userChat({ variables: { senderName: this.props.user, receiverName: name } });
        this.setState({ receiverName: name, userId: result.data.userChat.chatUserId, display: 'show', triggerCreateChat: true });
        this.disable = true;
    }

    componentDidMount() {
        // this.props.data.subscribeToMore({
        //     document: USER_JOIN_SUBSCRIPTION,
        //     updateQuery: (prev, { subscriptionData }) => {
        //         if (!subscriptionData.data) return prev;
        //         const newName = subscriptionData.data.userJoined;
        //         return prev.users.push(newName);
        //     }
        // })
        // this.setState({ subscribedNewUser: true });
        this.fetchUserFromQuery();
    }

    fetchUserFromQuery = async () => {
        const { client } = this.props;
        const result = await client.query({
            query: SHOW_USER,
            variables: {
                user: this.props.user
            }
        });
        this.setState({ userList: result.data.users, filterUserList: result.data.users })
        // this.props.data.subscribeToMore({
        //     document: USER_JOIN_SUBSCRIPTION,
        //     updateQuery: (prev, { subscriptionData }) => {
        //         if (!subscriptionData.data) return prev;
        //         const newName = subscriptionData.data.userJoined;
        //         return prev.users.push(newName);
        //     }
        // })
        this.setState({ subscribedNewUser: true });
    }

    filterUser(userName) {
        let filterUserList = this.state.userList.filter((user) => {
            return user.name.toLowerCase().includes(userName)
        })
        this.setState({ filterUserList: filterUserList })
    }

    removeUser(e){
        e.preventDefault();
        // console.log('Line ---- 102',this.props.onRemoveUser);
        this.props.onRemoveUser(e);
    }

    render() {
        window.HTMLElement.prototype.scrollIntoView = function () { };
        const data = this.props.data;
        if (data.loading) { return 'Loading'; }
        if (data.error) { return `${data.error}` }
        let list = this.state.filterUserList;
        return (
            <div className={"row " + (this.props.hidden === "show" ? "" : "hidden")}>
                <div className="display-user col-md-4 col-lg-3">
                    <div className="user-title">
                        <p className="float-left">Welcome {this.props.user}</p>
                        <button className="btn btn-outline-primary float-right btn-sm" onClick={(e)=>this.removeUser(e)}>Log out</button>
                    </div>
                    <SearchUser userListSearch={list} onFilterUser={this.filterUser} />

                    <div className="user-list">
                        <Scrollbars>
                            {list.map((user, i) => (
                                <ul className="list" key={i} >
                                    <li className={"clearfix " + (user.name === this.state.receiverName ? "user-name-active" : "")}>
                                        <div className="about">
                                            <Mutation mutation={INITIAL_CHAT}>
                                                {userChat => (
                                                    <div>
                                                        <ProfileUser userName={user.name} />
                                                        <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.name, userChat)}>{user.name}</div>
                                                    </div>
                                                )}
                                            </Mutation>
                                        </div>
                                    </li>
                                </ul>
                            ))}
                        </Scrollbars>
                    </div>
                </div>
                {this.state.triggerCreateChat && <CreateChat receiverName={this.state.receiverName} senderName={this.props.user} userId={this.state.userId} />}
            </div>
        );
    }
}

export default compose(
    graphql(INITIAL_CHAT, { name: 'intialChat' }),
    graphql(SHOW_USER, { options: (props) => ({ variables: { user: props.user } }) }), withApollo)(ShowUser);
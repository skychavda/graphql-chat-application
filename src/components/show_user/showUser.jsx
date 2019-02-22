import React from "react";
import { Mutation, compose, graphql, withApollo } from "react-apollo";
import gql from "graphql-tag";
import './showuser.css';
import { Scrollbars } from 'react-custom-scrollbars';

import CreateChat from '../create_chat/createChat';
import SearchUser from '../search_user/searchuser';
import ProfileUser from '../profile_user/profileuser';
import UserList from '../user_list/userlist';
// import NewMessage from '../newmessage';

const SHOW_USER = gql`
  query users($user:String!){
    users(name:$user){
      id
      userName
      firstName
      lastName
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
        //         const userList = this.state.filterUserList;
        //         const newName = subscriptionData.data.userJoined;
        //         console.log('Line ---- 68',newName);
        //         const userIndex = userList.findIndex(userList => userList.id === newName.id)
        //         if(userIndex > -1){
        //             userList.push(newName)
        //             this.setState({userList})
        //         }
        //         console.log('Line ---- 90',userIndex);
        //         // return prev.users.push(newName);
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
    }

    filterUser(userName) {
        let filterUserList = this.state.userList.filter((user) => {
            return user.userName.toLowerCase().includes(userName)
        })
        this.setState({ filterUserList: filterUserList })
    }

    removeUser(e) {
        e.preventDefault();
        // console.log('Line ---- 102',this.props.onRemoveUser);
        this.props.onRemoveUser(e);
    }

    render() {
        const data = this.props.data;
        if (data.loading) { return 'Loading'; }
        if (data.error) { return `${data.error}` }
        let list = this.state.filterUserList;
        return (
            <div className={"row " + (this.props.hidden === "show" ? "" : "hidden")}>
                <div className="user-list">
                    <Scrollbars>
                        {list.map((user, i) => (
                            <ul className="list" key={i} >
                                {/* + (user.name === this.state.receiverName ? "user-name-active" : "") */}
                                <li className={"clearfix "}>
                                    <div className="about">
                                        <Mutation mutation={INITIAL_CHAT}>
                                            {userChat => (
                                                <div>
                                                    <ProfileUser userName={user.userName} />
                                                    <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.userName, userChat)}>{user.userName}</div>
                                                </div>
                                            )}
                                        </Mutation>
                                    </div>
                                </li>
                            </ul>
                        ))}
                    </Scrollbars>
                </div>

                <UserList list={list}/>

                
                <div className="display-user col-md-4 col-lg-3">
                    <div className="user-title">
                        <p className="float-left">Welcome {this.props.user}</p>
                        <button className="btn btn-outline-primary float-right btn-sm" onClick={(e) => this.removeUser(e)}>Log out</button>
                    </div>
                    <SearchUser userListSearch={list} onFilterUser={this.filterUser} />


                    <div className="user-list">
                        <Scrollbars>
                            {list.map((user, i) => (
                                <ul className="list" key={i} >
                                    {/* + (user.name === this.state.receiverName ? "user-name-active" : "") */}
                                    <li className={"clearfix "}>
                                        <div className="about">
                                            <Mutation mutation={INITIAL_CHAT}>
                                                {userChat => (
                                                    <div>
                                                        <ProfileUser userName={user.userName} />
                                                        <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.userName, userChat)}>{user.userName}</div>
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
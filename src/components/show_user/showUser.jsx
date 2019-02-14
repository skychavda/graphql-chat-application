import React from "react";
import { Mutation, compose, graphql, withApollo } from "react-apollo";
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
            triggerCreateChat: false,
            subscribedNewUser: false,
            userActive: false,
            userList: []
        }
        this.initializeChat = this.initializeChat.bind(this);
    }

    async initializeChat(name, userChat) {
        let result = await userChat({ variables: { senderName: this.props.user, receiverName: name } });
        this.setState({ receiverName: name, userId: result.data.userChat.chatUserId, display: 'show', triggerCreateChat: true });
        this.disable = true;
    }

    componentWillMount() {
        this.props.data.subscribeToMore({
            document: USER_JOIN_SUBSCRIPTION,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const newName = subscriptionData.data.userJoined;
                return prev.users.push(newName);
            }
        })
        this.setState({ subscribedNewUser: true })
    }

    componentDidMount() {
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

        this.setState({ userList: result })
        // if (this._isMounted) {
        //     // Creating a deep copy since the value inside this have to be changed at later stage
        //     // const projectsClone = cloneDeep(result.data.bestProjects);
        //     this.setState({
        //         popularProjectLists: projectsClone,
        //     });
        // }
    }

    render() {
        const data = this.props.data;
        if (data.loading) { return 'Loading'; }
        if (data.error) { return `${data.error}` }
        let list = this.state.userList;
        return (
            <div className={"row " + (this.props.hidden === "show" ? "" : "hidden")}>
                <div className="display-user col-md-4 col-lg-3">
                    <div className="user-title">Welcome {this.props.user}</div>
                    <SearchUser userList={list}/>
                    <div className="user-list">
                        {list.data.users.map(user => (
                            <ul className="list">
                                <li className="clearfix">
                                    <div className="about">
                                        <Mutation mutation={INITIAL_CHAT}>
                                            {userChat => (
                                                <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.name, userChat)}>{user.name}</div>
                                            )}
                                        </Mutation>
                                    </div>
                                </li>
                            </ul>
                        ))}
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
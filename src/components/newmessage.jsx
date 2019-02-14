import React from 'react';
import { Query } from 'react-apollo';
import { gql } from 'apollo-boost';
import { Parser } from 'mr-emoji';

const GET_CHAT = gql`
    query GetChat($sender:String!,$receiver:String!){
        chats(senderName:$sender,receiverName:$receiver){
            message
            chatUserId
        }
    }
`;

const USER_CHAT = gql`
    query {
        userChats{
        senderName
        receiverName
    }
    }
`;

const MESSAGE_SUBSCRIPTION = gql`
    subscription MessageSubscription($chat_user_id:ID!){
        postMessage(chatUserId: $chat_user_id){
            message
            chatUserId
        }
    }
`;

class NewMessage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            subscribedToNewMessage: false,
        }
    }

    _subscribeToNewMessage = subscribeToMore => {
        subscribeToMore({
            document: MESSAGE_SUBSCRIPTION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const newMessage = subscriptionData.data.postMessage;
                return prev.chats.push(newMessage);
            }
        })
        this.setState({ subscribedToNewMessage: true })
    }

    render() {
        return (
            <div className="new-messages-box">
                <div className="user-title">New Message</div>
                <div className="new-message">
                    <Query query={USER_CHAT}>
                        {({ loading, data, error }) => {
                            if (loading) return 'Loading.';
                            if (error) return `${error}`;

                            return data.userChats.map((user) => (
                                <p>{user.senderName}</p>
                            ))
                        }}
                    </Query>
                    <Query query={GET_CHAT} variables={{ sender: this.props.senderName, receiver: this.props.receiverName }}>
                        {({ loading, data, error, subscribeToMore }) => {
                            if (loading) return 'Loading..';
                            if (error) return `${error}`;

                            if (!this.state.subscribedToNewMessage) {
                                this._subscribeToNewMessage(subscribeToMore)
                            }

                            return data.chats.map((chat, i) => (
                                <div key={i}><span className="parser"><Parser data={chat.message} /></span></div>
                            ))
                        }}
                    </Query>
                </div>
            </div>
        );
    }
}

export default NewMessage;